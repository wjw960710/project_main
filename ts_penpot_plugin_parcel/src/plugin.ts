import { MAP_LIB_GROUP_NAME, MAP_NAME } from './constant.ts'
import type { LibraryColor } from '@penpot/plugin-types'
import {name as manifestName} from '../public/manifest.json'
import {version as pkgVersion} from '../package.json'

console.log(penpot) // 為了能線上測試用

penpot.ui.open(`${manifestName} v${pkgVersion}`, '', {
	width: 375,
	height: 500,
})

penpot.ui.onMessage((message: PenpotMessage<MessageType>) => {
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