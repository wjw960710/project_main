export const MAP_NAME = {
  libLocal: 'localColors', // == penpot.currentFile?.name 會呈現這個
  libCommon: 'commonColors', // 不分模板通用資源
  libDark: 'darkCommonColors', // 深版通用資源
  libLight: 'lightCommonColors', // 淺版通用資源

  libPathDefault: 'default', // libColor 的 path 為空就會叫這
}

export const MAP_LIB_GROUP_NAME: Record<string, string> = {
  '不分模板通用資源': MAP_NAME.libCommon,
  '深版通用資源': MAP_NAME.libDark,
  '淺版通用資源': MAP_NAME.libLight,
}