/// <reference types="vitest/config" />

// Configure Vitest (https://vitest.dev/config/)

import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

export default defineConfig(() => ({
	build: {
		rolldownOptions: {
			input: {
				main: resolve(import.meta.dirname, 'index.html'),
				vue: resolve(import.meta.dirname, 'index-vue.html'),
			},
		},
	},
	plugins: [react(), vue(), UnoCSS()],
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['test/**/*.test.{ts,tsx}', '!test/**/*-browser.test.ts'],
	},
}))
