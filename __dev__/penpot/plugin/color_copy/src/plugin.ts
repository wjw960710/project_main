penpot.ui.open("Color Copy", "", {
  width: 375,
  height: 500,
})

penpot.ui.onMessage((message: PenpotMessage<MessageType>) => {
  onMessage(message, 'GET_LIB_COLORS', (_message) => {
    const list = penpot.library.local.colors
    const groupList = groupByToList(list, (color) => color.path || 'DEFAULT')
    penpot.ui.sendMessage({
      type: _message.type,
      data: groupList,
    })
  })

  onMessage(message, 'TEST', (_message) => {
    const list = penpot.library.local.components
    console.log(list)
    for (let i = 0; i < 1; i++) {
      list[i].mainInstance().export({
        type: 'png',
      })
    }
  })
})

function onMessage <T extends MessageType>(message: PenpotMessage<T>, type: T, callback: (message: PenpotMessage<T>) => void) {
  if (message.type === type) {
    callback(message)
  }
}

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
