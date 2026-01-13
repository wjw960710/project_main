import { useEffect } from 'react'

export function App() {
	useEffect(() => {
		window.addEventListener('message', (event: MessageEvent<UiMessage<MessageType>>) => {
			const msg = event.data

			if (msg.type === 'DEMO') {
				console.log(msg.data)
				downloadUint8Array(msg.data, 'test_file.png', 'application/transit+json')
			}
		})

		snedMessageToPenpot({ type: 'DEMO' })
	}, [])

	return <div>Resources Downloader</div>
}

function snedMessageToPenpot<T extends MessageType>(msg: PenpotMessage<T>) {
	parent.postMessage(msg, '*')
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