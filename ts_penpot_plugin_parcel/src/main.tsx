import ReactDOM from 'react-dom/client'
import { type FC } from 'react'
import qs from "query-string";
import {theme} from "./store/context.ts";
import type {Theme} from "@penpot/plugin-types";

const { pp_theme } = qs.parse(window.location.search) as { pp_theme?: Theme }
if (pp_theme === 'dark') {
	theme(pp_theme)
	document.documentElement.classList.add('dark')
}

bootstrap(
	VITE_IS_LOCAL ? import('@/app/app-resources-downloader.tsx') : import('@/app/app.tsx'),
)

async function bootstrap(importModule: Promise<{ App: FC }>) {
	const { App } = await importModule
	ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
}
