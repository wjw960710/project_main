type MessageType = 'COUNT'

// prettier-ignore
type PenpotMessage<T extends MessageType> =
  T extends 'COUNT'
    ? { type: T; data: number }
    : { type: T; data: undefined }

// prettier-ignore
type UiMessage<T extends MessageType> =
  T extends 'COUNT'
    ? { type: T; data: number }
    : { type: T; data: undefined }