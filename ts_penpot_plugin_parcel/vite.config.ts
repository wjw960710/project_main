import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { build as esbuild } from 'esbuild'
import path from 'node:path'
import manifest from './public/manifest.json'
import { omit, shake } from 'radash'

const PROJECT_DIR = manifest.name.replace(/\s/g, '_').toLowerCase()

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const isProduction = mode === 'production'
	const VITE_BASE = isProduction ? `penpot/plugin/${PROJECT_DIR}` : ''
	const VITE_OUT_DIR = isProduction ? `dist/${VITE_BASE}` : 'dist'
	const userConfig: UserConfig = {
		plugins: [tailwindcss(), react(), postProcessPlugin({ outDir: VITE_OUT_DIR })],
		base: `/${VITE_BASE}`,
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			},
		},
		preview: {
			port: 4444,
			cors: true,
		},
		define: {
			VITE_MODE: `'${mode}'`,
		},
		build: {
			outDir: VITE_OUT_DIR,
			assetsDir: '',
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

/**
 * @desc 多編譯一次 plugin 以解決不能使用 import 語法的問題
 */
function postProcessPlugin({ outDir }: { outDir: string }) {
	return {
		name: 'post-process-plugin',
		closeBundle: async () => {
			const pluginPath = path.resolve(__dirname, `${outDir}/plugin.js`)

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

			console.log('plugin.js 重新封裝完成！')
		},
	}
}
