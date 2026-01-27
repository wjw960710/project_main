import { MAP_LIB_GROUP_NAME, MAP_NAME } from '@/constant/color-copy.ts'
import type { Fill, LibraryColor, Shape, Stroke } from '@penpot/plugin-types'
import { name as manifestName } from '../public/manifest.json'
import { version as pkgVersion } from '../package.json'

console.log(penpot) // 為了能線上測試用

penpot.ui.open(
	`${manifestName} v${pkgVersion}`,
	`${VITE_BASE}index${VITE_IS_LOCAL ? '_local' : ''}.html?pp_theme=${penpot.theme}`,
	{
		width: 375,
		height: penpot.viewport.bounds.height,
	},
)

const globalState = {
	groupLibComponents: [] as PluginGroupLibComponent[],
}

penpot.ui.onMessage(async (message: PenpotMessage<MessageType>) => {
	const msg = message
	if (msg.type === 'GET_LOCAL_COLORS') {
		sendMessage(msg.type, penpot.library.local.colors)
	} else if (message.type === 'GET_CONNECTED_COLORS') {
		const groupColorsList: Record<string, LibraryColor[]> = {}

		penpot.library.connected.forEach(e => {
			if (!e.colors.length) return

			let name = MAP_LIB_GROUP_NAME[e.name]

			if (!name) name = e.name
			if (name === penpot.currentFile?.name) {
				name = MAP_NAME.libLocal
			}

			if (groupColorsList[name]) {
				groupColorsList[name] = groupColorsList[name].concat(e.colors)
			} else {
				groupColorsList[name] = e.colors
			}
		})

		sendMessage(msg.type, groupColorsList)
	} else if (msg.type === 'GET_GROUP_LIB_COMPONENTS') {
		const groupLibComponents = penpot.library.connected
			.filter(e => e.components.length > 0)
			.map(e => ({
				id: e.id,
				name: e.name,
				list: e.components,
			}))

		sendMessage(msg.type, (globalState.groupLibComponents = groupLibComponents))
	} else if (msg.type === 'EXPORT') {
		const dataList = Array.isArray(msg.data) ? msg.data : [msg.data]

		const res: UiMsgExportData = {
			name: 'undefined',
			list: [],
		}
		await processInChunks(dataList, 5, async e => {
			return Promise.all(
				e.map(async f => {
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
				}),
			)
		})

		sendMessage(msg.type, res)
	} else if (msg.type === 'REPLACE_COLOR') {
		recursiveChangeColor(msg.data.color, msg.data.location, penpot.selection)
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

function recursiveChangeColor(
	color: LibraryColor,
	location: PenpotReplaceShapeColorLocation,
	shapes: Shape[],
) {
	// 官方提供的類型與實際的不同= =
	const _color = color as LibraryColor & { fileId: string }

	shapes.forEach(shape => {
		if (
			penpot.utils.types.isGroup(shape) ||
			penpot.utils.types.isBoard(shape) ||
			penpot.utils.types.isBool(shape) ||
			penpot.utils.types.isMask(shape)
		) {
			recursiveChangeColor(_color, location, shape.children)
		} else if (
			penpot.utils.types.isRectangle(shape) ||
			penpot.utils.types.isEllipse(shape) ||
			penpot.utils.types.isText(shape)
		) {
			if (location === 'fill') {
				const fill: Fill = {
					fillColorRefId: _color.id,
					fillColorRefFile: _color.fileId,
				}

				if (_color.color) {
					fill.fillColor = _color.color
					fill.fillOpacity = _color.opacity
				} else if (_color.gradient?.stops.length) {
					fill.fillColorGradient = _color.gradient
				}

				shape.fills = [fill]
			} else if (location === 'stroke') {
				const stroke: Stroke = {
					strokeColorRefId: _color.id,
					strokeColorRefFile: _color.fileId,
				}

				if (_color.color) {
					stroke.strokeColor = _color.color
					stroke.strokeOpacity = _color.opacity
				} else if (_color.gradient?.stops.length) {
					stroke.strokeColorGradient = _color.gradient
				}

				const originStroke = shape.strokes[0]
				if (originStroke) {
					if (originStroke.strokeStyle) {
						stroke.strokeStyle = originStroke.strokeStyle
					} else {
						stroke.strokeStyle = 'solid'
					}

					if (originStroke.strokeWidth) {
						stroke.strokeWidth = originStroke.strokeWidth
					} else {
						stroke.strokeWidth = 1
					}

					if (originStroke.strokeAlignment) {
						stroke.strokeAlignment = originStroke.strokeAlignment
					} else {
						stroke.strokeAlignment = 'inner'
					}
				}

				shape.strokes = [stroke]
			}
		}
	})
}
