import { MAP_LIB_GROUP_NAME, MAP_NAME } from './constant.ts'
import type { LibraryColor } from '@penpot/plugin-types'

penpot.ui.open('Color Copy', '', {
	width: 375,
	height: 500,
})

penpot.ui.onMessage((message: PenpotMessage<MessageType>) => {
	if (message.type === 'GET_LOCAL_COLORS') {
		penpot.ui.sendMessage({
			type: message.type,
			data: penpot.library.local.colors,
		})
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

		penpot.ui.sendMessage({
			type: message.type,
			data: groupColorsList,
		})
	}
})
