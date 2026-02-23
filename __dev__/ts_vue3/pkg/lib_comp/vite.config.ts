import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import UnoCSS from 'unocss/vite'
import checker from 'vite-plugin-checker'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		vueJsx(),
		UnoCSS(),
		checker({
			vueTsc: true,
			enableBuild: true,
		}),
		dts({
			include: ['src/**/*'],
			exclude: ['src/main.ts', 'src/App.vue'],
			outDir: 'dist',
			tsconfigPath: './tsconfig.app.json',
		}),
	],
	build: {
		copyPublicDir: false,
		sourcemap: true,
		cssCodeSplit: false,
		lib: {
			entry: path.resolve(__dirname, 'src/index.ts'),
			name: 'LibComp',
			fileName: 'index',
			formats: ['es'],
		},
		rollupOptions: {
			external: ['vue'],
			output: {
				// 讓 Rollup 保持模組結構，實現更好的搖樹優化
				preserveModules: true,
				preserveModulesRoot: 'src',
				// 使用 [name].js 而非 index.js
				entryFileNames: '[name].js',
				assetFileNames: '[name].[ext]',
				globals: {
					vue: 'Vue',
				},
			},
		},
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
})
