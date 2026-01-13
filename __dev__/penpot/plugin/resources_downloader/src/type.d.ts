type MessageType =
	| 'DEMO'

type PenpotMessage<T extends MessageType> = {
	type: T
}

type UiMessage<T extends MessageType> = T extends 'DEMO'
	? { type: T; data: Uint8Array }
	: { type: T; data: never }
