type MessageType = 'GET_LIB_COLORS'
  | 'TEST'

type PenpotMessage<T extends MessageType> = {
  type: T
}

type LocalGroupColor = { _key: string, data: import("@penpot/plugin-types").LibraryColor[] }
type UiMessage<T extends MessageType> = {
  type: T,
  data: T extends 'GET_LIB_COLORS'
    ? LocalGroupColor[]
    : never
}