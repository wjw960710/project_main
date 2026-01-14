type MessageType =
	| 'GET_GROUP_LIB_COMPONENTS' // 取得元件列表
	| 'EXPORT' // 取得導出數據

type UiLibComp = Pick<import('@penpot/plugin-types').LibraryComponent, 'id' | 'libraryId' | 'name' | 'path'>

type ExportData = {
	ids: [string /* 群組 ID */, string /* 元件 ID */]
	config: import('@penpot/plugin-types').Export
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
type PenpotMessage<T extends MessageType> = T extends 'EXPORT'
	? {
			type: T
			data: ExportData | ExportData[]
		}
	: { type: T; data: undefined }

// prettier-ignore
type UiMessage<T extends MessageType> = T extends 'GET_GROUP_LIB_COMPONENTS'
	? { type: T; data: UiGroupLibComponent[] }
	: T extends 'EXPORT'
		? { type: T; data: Uint8Array[] }
		: { type: T; data: undefined }
