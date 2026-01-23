type MessageType =
	| 'GET_LOCAL_COLORS' // 取得本地顏色資源
	| 'GET_CONNECTED_COLORS' // 取得該檔按所有關聯的顏色資源
	| 'GET_GROUP_LIB_COMPONENTS' // 取得元件列表
	| 'EXPORT' // 取得導出數據

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

type GroupLibComponent<Child extends UiLibComp> = {
	id: string
	name: string
	list: Child[]
}

type UiGroupLibComponent = GroupLibComponent<UiLibComp>

type PluginGroupLibComponent = GroupLibComponent<
	import('@penpot/plugin-types').LibraryComponent
>

// prettier-ignore
type PenpotMessage<T extends MessageType> =
	T extends 'EXPORT'
		? {
			type: T
			data: PenpotMsgExportData | PenpotMsgExportData[]
		}
		: { type: T; data: undefined }

// prettier-ignore
type UiMessage<T extends MessageType> =
	T extends 'GET_LOCAL_COLORS'
		? { type: T; data: import('@penpot/plugin-types').LibraryColor[] }
	: T extends 'GET_CONNECTED_COLORS'
		? { type: T; data: Record<string, import('@penpot/plugin-types').LibraryColor[]> }
	: T extends 'GET_GROUP_LIB_COMPONENTS'
		? { type: T; data: UiGroupLibComponent[] }
	: T extends 'EXPORT'
		? { type: T; data: UiMsgExportData }
	: { type: T; data: undefined }
