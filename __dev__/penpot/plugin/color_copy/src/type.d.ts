type PenpotMessageType = 'count'

type PenpotMessage<T extends PenpotMessageType> = {
  type: T,
  data: T extends PenpotMessageType ? number : never
}

type UiMessageType = 'count'

type UiMessage<T extends UiMessageType> = {
  type: T,
  data: T extends UiMessageType ? number : never
}