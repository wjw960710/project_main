penpot.ui.open("Color Copy", "", {
  width: 375,
  height: 500,
})

penpot.ui.onMessage((message: PenpotMessage<PenpotMessageType>) => {
  switch (message.type) {
    case 'GET_LOCAL_COLOR_LIST': {
      const localColorList = penpot.library.local.colors
      const localGroupColorList = groupByToList(localColorList, (color) => color.path || 'DEFAULT')
      const msg: UiMessage<'GET_LOCAL_COLOR_LIST'> = {
        type: 'GET_LOCAL_COLOR_LIST',
        data: localGroupColorList,
      }
      penpot.ui.sendMessage(msg)
      break
    }
    default:
  }
})

function groupByToList <T, K extends string | number>(
  items: T[],
  keySelector: (item: T) => K
): { _key: K, data: T[] }[] {
  const keyIdxMap = new Map<string | number, number>()
  const list: { _key: K, data: T[] }[] = [];

  for (const item of items) {
    const key = keySelector(item);
    let idx = keyIdxMap.get(key);

    if (idx == null) {
      list.push({_key: key, data: []})
      idx = list.length - 1
      keyIdxMap.set(key, idx)
    }

    list[idx!].data.push(item);
  }

  return list;
}


function groupByToMap<T, K>(
  items: T[],
  keySelector: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();

  for (const item of items) {
    const key = keySelector(item);
    const group = map.get(key);

    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }

  return map;
}
