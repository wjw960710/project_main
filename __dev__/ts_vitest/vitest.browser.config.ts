import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
	test: {
		name: 'browser',
		browser: {
			enabled: true,
			instances: [{ browser: 'chromium' }],
			provider: playwright(),
			headless: false,
		},
		include: ['test/__eg__/*-browser.test.ts'],
		globals: true,
	},
})
