import { defineConfig, loadEnv, type Plugin, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { build as esbuild } from 'esbuild'
import path from 'node:path'
import { omit, shake } from 'radash'
import manifest from './public/manifest.json'
import fs from 'node:fs'
import https from 'node:https'
import fetch from 'node-fetch'
import fg from 'fast-glob'
import { parallel } from 'radash'

type Env = Record<keyof ServerEnv, string>

const PROJECT_DIR = manifest.name.replace(/\s/g, '_').toLowerCase()
const VITE_OUT_DIR = 'dist'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const isProduction = mode === 'production'
	const env = loadEnv(mode, process.cwd(), ['SERVER_', 'VITE_NEXUS_']) as Env
	const hasNexusConfig = everyNexusConfig(env)

	if (isProduction) {
		if (!hasNexusConfig) {
			throw new Error('SERVER_NEXUS_ 配置有缺漏')
		}
	}

	// 將 NEXUS 結尾路徑拚上專案名稱
	env.SERVER_NEXUS_DIRECTORY = path.posix.join(
		'/',
		env.SERVER_NEXUS_DIRECTORY,
		PROJECT_DIR,
		'/',
	)

	const VITE_BASE = isProduction
		? path.posix.join('/repository', env.SERVER_NEXUS_REPOSITORY, env.SERVER_NEXUS_DIRECTORY)
		: '/'
	const userConfig: UserConfig = {
		plugins: [
			tailwindcss(),
			react(),
			postProcessPlugin({ env, base: VITE_BASE, outDir: VITE_OUT_DIR, isProduction }),
			myPreviewServerPlugin({ outDir: VITE_OUT_DIR }),
		],
		base: VITE_BASE,
		resolve: {
			alias: {
				'@': path.join(process.cwd(), 'src'),
			},
		},
		preview: {
			port: 4444,
			cors: true,
		},
		define: {
			VITE_MODE: `'${mode}'`,
			VITE_BASE: `'${VITE_BASE}'`,
		},
		build: {
			outDir: VITE_OUT_DIR,
			rolldownOptions: {
				input: {
					plugin: 'src/plugin.ts',
					index: 'index.html',
				},
				output: {
					entryFileNames: '[name].js',
				},
			},
		},
	}

	console.log(fillLine('='))
	console.log('📌 vite 配置')
	console.log(
		JSON.stringify(
			shake(omit(userConfig, ['plugins']), v => v instanceof Function),
			null,
			2,
		),
	)
	console.log(fillLine('='))

	return userConfig
})

/**
 * 將文字鋪滿全行
 * @param text - 填充字符，默認為空格
 */
function fillLine(text = ' ') {
	// 獲取終端寬度，如果獲取不到（如在非 TTY 環境）則默認為 80
	const width = process.stdout.columns || 80
	let result = ''

	while (result.length < width) {
		result += text
	}
	result = result.slice(0, width)

	return result
}

function postProcessPlugin({
	env,
	base,
	outDir,
	isProduction,
}: {
	env: Env
	base: string
	outDir: string
	isProduction: boolean
}): Plugin {
	const distPath = path.join(process.cwd(), outDir)

	async function bundlePluginJs() {
		const pluginPath = path.join(distPath, 'plugin.js')

		console.log('正在使用 esbuild 重新封裝 plugin.js...')

		await esbuild({
			entryPoints: [pluginPath],
			outfile: pluginPath,
			bundle: true,
			minify: true,
			allowOverwrite: true,
			format: 'iife',
			platform: 'browser',
		})

		console.log('✅ plugin.js 重新封裝完成！')
	}

	async function replaceManifestConfig() {
		if (!isProduction) return

		console.log('開始替換 manifest.json 資源路徑...')

		const manifestPath = path.join(distPath, 'manifest.json')
		const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf-8'))

		manifest.code = path.posix.join(base, getFilename(manifest.code))
		manifest.icon = path.posix.join(base, getFilename(manifest.icon))

		await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2))

		console.log('✅ manifest.json 資源路徑替換完成！')
	}

	async function uploadToNexus() {
		if (!isProduction) return

		console.log('正將資源發佈至 Nexus...')

		const entries = await fg(['**/*'], { dot: true, cwd: distPath })
		const url = `${env.SERVER_NEXUS_URL}/service/rest/v1/components?repository=${env.SERVER_NEXUS_REPOSITORY}`

		const credentials = Buffer.from(
			`${env.SERVER_NEXUS_USERNAME}:${env.SERVER_NEXUS_PASSWORD}`,
		).toString('base64')

		const formData = new FormData()
		formData.append('raw.directory', env.SERVER_NEXUS_DIRECTORY)

		const fileList = await parallel(5, entries, async entry => {
			return {
				filename: getFilename(entry),
				entry,
				buffer: await fs.promises.readFile(path.join(distPath, entry)),
			}
		})

		fileList.forEach((e, i) => {
			const n = i + 1
			formData.append(`raw.asset${n}`, new Blob([e.buffer]), e.filename)
			formData.append(`raw.asset${n}.filename`, e.entry)
		})

		try {
			const agent = new https.Agent({
				rejectUnauthorized: false,
			})
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					Authorization: `Basic ${credentials}`,
				},
				body: formData,
				agent,
			})

			// 讀取錯誤響應內容
			const responseText = await response.text()

			if (!response.ok) {
				throw new Error(
					`❌ 上傳失敗: ${response.status} ${response.statusText}\n${responseText}`,
				)
			}

			console.log(`✅ 成功上傳到 Nexus`)
			return response
		} catch (error) {
			console.error('❌ Nexus 上傳失敗:', error)
		}
	}

	return {
		name: 'post-process-plugin',
		closeBundle: async function () {
			await Promise.all([bundlePluginJs(), replaceManifestConfig()])
			await uploadToNexus()
		},
	}
}

function everyNexusConfig(config: ServerEnv) {
	for (let name in config) {
		const _name = name as keyof ServerEnv
		if (_name.includes('SERVER_NEXUS_')) {
			return config[_name].trim().length > 0
		}
	}

	return false
}

function getFilename(filepath: string) {
	return filepath.split(/[/\\]/).pop()!
}

function myPreviewServerPlugin({ outDir }: { outDir: string }): Plugin {
	return {
		name: 'my-preview-server-plugin',
		configurePreviewServer(server) {
			server.middlewares.use('/manifest.json', async (_req, res, _next) => {
				const manifestPath = path.join(outDir, 'manifest.json')
				const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf-8'))

				manifest.name = `(DEV) ${manifest.name}`

				res.setHeader('Content-Type', 'application/json')
				res.setHeader('Access-Control-Allow-Origin', '*')

				res.end(JSON.stringify(manifest, null, 2))
			})
		},
	}
}
