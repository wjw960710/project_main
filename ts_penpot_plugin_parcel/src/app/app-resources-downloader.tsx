import { useEffect, useState } from 'react'
import JSZip from 'jszip'
import { snedMessage } from '@/util/action-ui.ts'

export function App() {
	const [groupLibComponents, setGroupLibComponents] = useState<UiGroupLibComponent[]>([])

	useEffect(() => {
		window.addEventListener('message', (event: MessageEvent<UiMessage<MessageType>>) => {
			const msg = event.data

			if (msg.type === 'GET_GROUP_LIB_COMPONENTS') {
				setGroupLibComponents(msg.data)
			} else if (msg.type === 'EXPORT') {
				if (msg.data.list.length > 1) {
					// 多個檔案：打包成 ZIP
					const zip = new JSZip()
					const nameIdxObj: Record<string, number> = {}

					msg.data.list.forEach(exportData => {
						if (exportData.name in nameIdxObj) nameIdxObj[exportData.name]++
						else nameIdxObj[exportData.name] = 0

						let fileName = exportData.name
						if (!!nameIdxObj[exportData.name]) {
							fileName += ` (${nameIdxObj[exportData.name]})`
						}

						zip.file(`${fileName}.png`, exportData.file)
					})

					zip.generateAsync({ type: 'uint8array' }).then(content => {
						downloadUint8Array(content, `${msg.data.name}.zip`, 'application/zip')
					})
				} else if (msg.data.list.length === 1) {
					// 單一檔案
					const exportData = msg.data.list[0]
					downloadUint8Array(exportData.file, `${exportData.name}.png`, 'image/png')
				}
			}
		})

		snedMessage('GET_GROUP_LIB_COMPONENTS')
	}, [])

	function handleDownload(ids: [string, string]) {
		return () => {
			snedMessage('EXPORT', {
				ids,
				config: { type: 'png' },
			})
		}
	}

	function handleDownloadList(groupId: string, libComps: UiLibComp[]) {
		return () => {
			snedMessage(
				'EXPORT',
				libComps.map(e => ({ ids: [groupId, e.id], config: { type: 'png' } })),
			)
		}
	}

	return (
		<div>
			{groupLibComponents.map(e => {
				return (
					<div key={e.name}>
						<div className={'cursor-pointer'} onClick={handleDownloadList(e.id, e.list)}>
							{e.name}
						</div>
						{e.list.map(f => (
							<div
								className={'cursor-pointer pl-2'}
								key={f.name}
								onClick={handleDownload([e.id, f.id])}
							>
								{f.name} | {f.path}
							</div>
						))}
					</div>
				)
			})}
		</div>
	)
}

/**
 * @param data API 回傳的 Uint8Array
 * @param filename 檔案名稱（例如 "image.png" 或 "data.pdf"）
 * @param mimeType 檔案類型（例如 "image/png"），預設為二進制流
 */
async function downloadUint8Array(
	data: Uint8Array,
	filename: string,
	mimeType: string = 'application/octet-stream',
) {
	try {
		// 將 Uint8Array 包裝進 Blob
		const blob = new Blob([data as any], { type: mimeType })

		// 建立一個指向該 Blob 的暫時性 URL
		const url = window.URL.createObjectURL(blob)

		// 建立隱藏的 <a> 標籤
		const link = document.createElement('a')
		link.href = url
		link.download = filename

		// 觸發點擊並移除
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)

		// 釋放 URL 物件以節省記憶體
		window.URL.revokeObjectURL(url)
	} catch (error) {
		console.error('下載檔案時出錯:', error)
	}
}