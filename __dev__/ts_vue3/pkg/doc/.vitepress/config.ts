import { defineConfig } from 'vitepress'

export default defineConfig({
	title: 'Component Library Docs',
	description: 'Documentation for ts_vue3 components',
	themeConfig: {
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Guide', link: '/guide' },
		],
		sidebar: [
			{
				text: 'Guide',
				items: [{ text: 'Introduction', link: '/guide' }],
			},
		],
	},
})
