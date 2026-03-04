/// <reference types="vitest/config" />

// Configure Vitest (https://vitest.dev/config/)

import { defineConfig } from 'vite'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['test/__eg__/*.test.ts', '!test/__eg__/*-browser.test.ts'],
	},
})
