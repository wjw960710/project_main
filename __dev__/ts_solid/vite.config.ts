import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import devtools from 'solid-devtools/vite'
import unocssPlugin from 'unocss/vite'

export default defineConfig({
	plugins: [devtools(), unocssPlugin(), solidPlugin()],
	server: {
		port: 3837,
	},
	build: {
		target: 'esnext',
	},
})
