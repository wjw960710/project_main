import { App as CopyColorApp } from '@/app/app-copy-color.tsx'
import { App as ResourcesDownloaderApp } from '@/app/app-resources-downloader.tsx'
import { Tabs, TabsList, TabsTrigger } from '@/shadcn/official/component-ui/tabs.tsx'
import { type FC, useMemo, useState } from 'react'
import { MdComputer, MdDesignServices } from 'react-icons/md'
import { Toaster } from '@/shadcn-official/component-ui/sonner.tsx'

type DeptTab = {
	key: string
	name: string
	Icon: FC
	children: AppTab[]
}

type AppTab = {
	key: string
	name: string
	experimental?: boolean
}

let tabList: DeptTab[] = [
	{
		key: 'ui',
		name: '設計',
		Icon: MdDesignServices,
		children: [
			{
				key: 'colorManager',
				name: '顏色管理',
				experimental: true,
			},
		],
	},
	{
		key: 'dev',
		name: '開發',
		Icon: MdComputer,
		children: [
			{
				key: 'copyColor',
				name: '顏色複製',
			},
			{
				key: 'resourcesDownloader',
				name: '資源下載',
				experimental: true,
			},
		],
	},
]

tabList = tabList.reduce((acc, e) => {
	e.children = e.children.filter(f => !f.experimental)
	if (e.children.length) acc.push(e)
	return acc
}, [] as DeptTab[])

export function App() {
	const [deptCurrent, setDeptCurrent] = useState(0)
	const [appCurrent, setAppCurrent] = useState(0)
	const view = useMemo(() => {
		const deptKey = tabList[deptCurrent].key
		const appKey = tabList[deptCurrent].children[appCurrent].key

		if (deptKey === 'ui') {
			if (appKey === 'colorManager') return null
		}

		if (deptKey === 'dev') {
			if (appKey === 'copyColor') return <CopyColorApp />
			if (appKey === 'resourcesDownloader') return <ResourcesDownloaderApp />
		}

		return null
	}, [deptCurrent, appCurrent])

	function handleChangeDeptTab(tab: string) {
		setDeptCurrent(tabList.findIndex(e => e.key === tab))
		setAppCurrent(0)
	}

	function handleChangeAppTab(tab: string) {
		setAppCurrent(tabList[deptCurrent].children.findIndex(e => e.key === tab))
	}

	return (
		<>
			{tabList.length ? (
				<>
					<div className="flex items-center bg-muted rounded-lg px-1 py-0.5 my-1">
						<Tabs value={tabList[deptCurrent].key} onValueChange={handleChangeDeptTab}>
							<TabsList>
								{tabList.map(e => {
									return (
										<TabsTrigger key={e.key} value={e.key}>
											<e.Icon />
										</TabsTrigger>
									)
								})}
							</TabsList>
						</Tabs>

						<Tabs
							value={tabList[deptCurrent].children[appCurrent].key}
							onValueChange={handleChangeAppTab}
						>
							<TabsList>
								{tabList[deptCurrent].children.map(e => {
									return (
										<TabsTrigger key={e.key} value={e.key}>
											{e.name}
										</TabsTrigger>
									)
								})}
							</TabsList>
						</Tabs>
					</div>

					{view}
				</>
			) : (
				'暫無應用'
			)}
			<Toaster richColors />
		</>
	)
}
