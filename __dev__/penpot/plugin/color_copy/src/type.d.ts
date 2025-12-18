type PenpotMessageType = 'GET_LOCAL_COLOR_LIST'

type PenpotMessage<T extends PenpotMessageType> = {
  type: T
}

type UiMessageType = 'GET_LOCAL_COLOR_LIST'
type LOCAL_GROUP_COLOR_List = { _key: string, data: import("@penpot/plugin-types").LibraryColor[] }[]
type UiMessage<T extends UiMessageType> = {
  type: T,
  data: T extends 'GET_LOCAL_COLOR_LIST' ? LOCAL_GROUP_COLOR_List : never
}