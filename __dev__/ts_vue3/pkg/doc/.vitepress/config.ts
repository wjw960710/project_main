import { defineConfig } from 'vitepress'
import UnoCSS from 'unocss/vite'
import path from 'node:path'

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
			{
				text: 'Components',
				items: [{ text: 'Button', link: '/button' }],
			},
		],
	},
	vite: {
		plugins: [UnoCSS(path.resolve(__dirname, '../../lib_comp/uno.config.ts'))],
	},
})
