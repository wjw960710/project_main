import { App as CopyColorApp } from '@/app/app-copy-color.tsx'
import { App as ResourcesDownloaderApp } from '@/app/app-resources-downloader.tsx'
import { Tabs, TabsList, TabsTrigger } from '@/shadcn/official/component-ui/tabs.tsx'
import { useState } from 'react'
import { MdComputer } from 'react-icons/md'
import { Toaster } from '@/shadcn-official/component-ui/sonner.tsx'

const DEPT_NAME = {
	develop: '開發',
}

const APP_NAME = {
	develop: {
		copyColor: '顏色複製',
		resourcesDownloader: '資源下載',
	},
}

export function App() {
	const [deptTab, setDeptTab] = useState(DEPT_NAME.develop)
	const [appTab, setAppTab] = useState(APP_NAME.develop.copyColor)

	return (
		<>
			<div className="flex items-center bg-muted rounded-lg px-1 py-0.5 my-1">
				<Tabs defaultValue={deptTab} onValueChange={setDeptTab}>
					<TabsList>
						<TabsTrigger value={DEPT_NAME.develop}>
							<MdComputer />
						</TabsTrigger>
					</TabsList>
				</Tabs>
				<Tabs defaultValue={appTab} onValueChange={setAppTab}>
					<TabsList>
						<TabsTrigger value={APP_NAME.develop.copyColor}>
							{APP_NAME.develop.copyColor}
						</TabsTrigger>
						<TabsTrigger value={APP_NAME.develop.resourcesDownloader}>
							{APP_NAME.develop.resourcesDownloader}
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>
			{deptTab === DEPT_NAME.develop ? (
				appTab === APP_NAME.develop.copyColor ? (
					<CopyColorApp />
				) : appTab === APP_NAME.develop.resourcesDownloader ? (
					<ResourcesDownloaderApp />
				) : null
			) : null}
			<Toaster richColors />
		</>
	)
}
