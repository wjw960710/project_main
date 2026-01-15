declare const VITE_MODE: string

type MessageType =
	| 'GET_LOCAL_COLORS' // 取得本地顏色資源
	| 'GET_CONNECTED_COLORS' // 取得該檔按所有關聯的顏色資源

type PenpotMessage<T extends MessageType> = {
	type: T
	data: undefined
}

// prettier-ignore
type UiMessage<T extends MessageType> = T extends 'GET_LOCAL_COLORS'
	? { type: T; data: import('@penpot/plugin-types').LibraryColor[] }
	: T extends 'GET_CONNECTED_COLORS'
		? { type: T; data: Record<string, import('@penpot/plugin-types').LibraryColor[]> }
		: { type: T; data: undefined }
