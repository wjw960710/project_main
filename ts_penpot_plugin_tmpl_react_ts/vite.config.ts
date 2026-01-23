import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'
import { build as esbuild } from 'esbuild'

const VITE_OUT_DIR = 'dist'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tailwindcss(),
		react(),
		postProcessPlugin({ outDir: VITE_OUT_DIR }),
		myPreviewServerPlugin({ outDir: VITE_OUT_DIR }),
	],
	resolve: {
		alias: {
			'@': path.join(process.cwd(), './src'),
		},
	},
	build: {
		outDir: VITE_OUT_DIR,
		rolldownOptions: {
			input: {
				plugin: 'src/plugin.ts',
				index: './index.html',
			},
			output: {
				entryFileNames: '[name].js',
			},
		},
	},
	preview: {
		port: 4444,
		cors: true,
	},
})

/**
 * @desc 多編譯一次 plugin 以解決不能使用 import 語法的問題
 */
function postProcessPlugin({ outDir }: { outDir: string }): Plugin {
	return {
		name: 'post-process-plugin',
		closeBundle: async () => {
			const pluginPath = path.resolve(process.cwd(), `${outDir}/plugin.js`)

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
