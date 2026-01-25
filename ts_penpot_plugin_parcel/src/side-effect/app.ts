import qs from 'query-string'
import type { Theme } from '@penpot/plugin-types'
import { theme$ } from '@/store/context.ts'

const { pp_theme } = qs.parse(window.location.search) as { pp_theme?: Theme }
if (pp_theme === 'dark') {
	theme$(pp_theme)
	document.documentElement.classList.add('dark')
}
