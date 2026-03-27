type MessageType =
	| 'GET_LOCAL_COLORS' // 取得本地顏色資源
	| 'GET_CONNECTED_COLORS' // 取得該檔案所有關聯的顏色資源
	| 'GET_GROUP_LIB_COMPONENTS' // 取得元件列表
	| 'EXPORT' // 取得導出數據
	| 'REPLACE_COLOR' // 替換形狀顏色
	| 'SELECTION_CHANGE' // penpot 事件傳遞
	| 'SELECTION_FLAT_INFO' // 取得 selection 的扁平化訊息
	| 'CREATE_LIB_COLOR' // 新增資源顏色
	| 'CHANGE_ALL_ITEM_COLOR' // 切換所有元素顏色
	| 'GET_CONNECTED_COLORS2' // 取得該檔案所有關聯的顏色資源

type UiLibComp = Pick<
	import('@penpot/plugin-types').LibraryComponent,
	'id' | 'libraryId' | 'name' | 'path'
>

type PenpotMsgExportData = {
	ids: [string /* 群組 ID */, string /* 元件 ID */]
	config: import('@penpot/plugin-types').Export
}

type UiMsgExportData = {
	name: string
	list: {
		name: string
		file: Uint8Array
	}[]
}

type UiMsgSelectionData = {
	ids: string[]
	shapes: import('@penpot/plugin-types').Shape[]
}

type UiMsgSelectionFlatInfoData = {
	shapes: import('@penpot/plugin-types').Shape[]
}

type GroupLibComponent<Child extends UiLibComp> = {
	id: string
	name: string
	list: Child[]
}

type UiGroupLibComponent = GroupLibComponent<UiLibComp>

type PluginGroupLibComponent = GroupLibComponent<
	import('@penpot/plugin-types').LibraryComponent
>

type PenpotReplaceShapeColorLocation = 'fill' | 'stroke'

type PenpotColorStop = { color: string; opacity?: number; offset: number }

type UiConnectedColor = {
	id: string
	name: string
	colors: import('@penpot/plugin-types').LibraryColor[]
}

// prettier-ignore
type PenpotMessage<T extends MessageType> =
	T extends 'EXPORT'
		? {
			type: T
			data: PenpotMsgExportData | PenpotMsgExportData[]
		}
	: T extends 'REPLACE_COLOR'
		? {
			type: T
			data: {
				color: import('@penpot/plugin-types').LibraryColor
				location: PenpotReplaceShapeColorLocation
			}
		}
	: T extends 'CREATE_LIB_COLOR'
		? {
			type: T
			data: {
				name: string
				color: import('@penpot/plugin-types').Fill | import('@penpot/plugin-types').Stroke | import('@penpot/plugin-types').Shadow
			}
		}
	: T extends 'CHANGE_ALL_ITEM_COLOR'
		? {
			type: T
			data: {
				from: [string/*groupId*/, string/*colorId*/]
				to: [string/*groupId*/, string/*colorId*/]
			}
		}
		: { type: T; data: undefined }

// prettier-ignore
type UiMessage<T extends MessageType> =
	T extends 'GET_LOCAL_COLORS'
		? { type: T; data: import('@penpot/plugin-types').LibraryColor[] }
	: T extends 'GET_CONNECTED_COLORS'
		? { type: T; data: Record<string, import('@penpot/plugin-types').LibraryColor[]> }
	: T extends 'GET_CONNECTED_COLORS2'
		? { type: T; data: UiConnectedColor[] }
	: T extends 'GET_GROUP_LIB_COMPONENTS'
		? { type: T; data: UiGroupLibComponent[] }
	: T extends 'EXPORT'
		? { type: T; data: UiMsgExportData }
	: T extends 'SELECTION_CHANGE'
		? { type: T; data: UiMsgSelectionData }
	: T extends 'SELECTION_FLAT_INFO'
		? { type: T; data: UiMsgSelectionFlatInfoData }
	: { type: T; data: undefined }
