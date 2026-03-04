import { defineWorkspace } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineWorkspace([
	{
		test: {
			name: 'unit',
			environment: 'jsdom',
			include: ['test/__eg__/*.test.ts', '!test/__eg__/*-browser.test.ts'],
			globals: true,
		},
	},
	{
		test: {
			name: 'browser',
			browser: {
				enabled: true,
				name: 'chromium',
				provider: playwright(),
			},
			include: ['test/__eg__/*-browser.test.ts'],
			globals: true,
		},
	},
])
