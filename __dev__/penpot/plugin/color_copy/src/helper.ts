export function groupByToList <T, K extends string | number>(
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


export function groupByToMap<T, K>(
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