import ReactDOM from 'react-dom/client'
import { type FC } from 'react'
import { isDev } from '@/constant/vite.ts'

bootstrap(
	isDev
		? import('@/app/app-resources-downloader.tsx')
		: import('@/app/app.tsx')
)

async function bootstrap (importModule: Promise<{ App: FC }>) {
	const { App } = await importModule
	ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
}