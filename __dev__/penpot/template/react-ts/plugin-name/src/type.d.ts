type MessageType = 'COUNT'

type PenpotMessage<T extends MessageType> = {
  type: T,
  data: T extends 'COUNT' ? number : never
}

type UiMessage<T extends MessageType> = {
  type: T,
  data: T extends 'COUNT' ? number : never
}