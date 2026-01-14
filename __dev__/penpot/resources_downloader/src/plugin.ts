// 為了能線上測試用
console.log(penpot)

penpot.ui.open('Resources Downloader', '', {
	width: 375,
	height: 500,
})

const globalState = {
	groupLibComponents: [] as PluginGroupLibComponent[],
}

penpot.ui.onMessage(async (message: PenpotMessage<MessageType>) => {
	const msg = message
	if (msg.type === 'GET_GROUP_LIB_COMPONENTS') {
		const groupLibComponents = penpot.library.connected
			.filter(e => e.components.length > 0)
			.map(e => ({
				id: e.id,
				name: e.name,
				list: e.components,
			}))

		sendMessage(msg.type, globalState.groupLibComponents = groupLibComponents)
	} else if (msg.type === 'EXPORT') {
		const dataList = Array.isArray(msg.data)
			? msg.data
			: [msg.data]

		const res: UiMsgExportData = {
			name: 'undefined',
			list: [],
		}
		await processInChunks(dataList, 5, async e => {
			return Promise.all(e.map(async f => {
				const { ids, config = { type: 'png' } } = f
				const group = globalState.groupLibComponents.find(g => g.id === ids[0])
				const component = group?.list?.find(g => g.id === ids[1])

				const u8Arr = await component?.mainInstance().export(config)
				if (u8Arr) {
					res.name = group!.name
					res.list.push({
						name: component!.name,
						file: u8Arr,
					})
				}
			}))
		})

		sendMessage(msg.type, res)
	}
})

function sendMessage<T extends MessageType>(
	type: T,
	...args: UiMessage<T> extends { type: any; data: infer D }
		? D extends undefined
			? []
			: [D]
		: []
) {
	penpot.ui.sendMessage({
		type,
		data: (args as any[])[0],
	})
}

/**
 * 將陣列分段（Chunking）異步處理，避免一次性執行大量任務導致阻塞
 *
 * @param items - 待處理的原始資料陣列
 * @param chunkSize - 每一批次（Chunk）的大小
 * @param processor - 處理每一批次資料的函式，支援異步操作
 */
export async function processInChunks<T, R>(
	items: T[],
	chunkSize: number,
	processor: (chunk: T[], startIndex: number) => R | Promise<R>,
) {
	const totalItems = items.length

	// 依照分段大小遍歷原始陣列
	for (let i = 0; i < totalItems; i += chunkSize) {
		// 擷取當前分段的資料
		const chunk = items.slice(i, i + chunkSize)

		// 執行處理函式，並等待其完成（如果是 Promise）
		const result = processor(chunk, i)
		if (result instanceof Promise) {
			await result
		}
	}
}