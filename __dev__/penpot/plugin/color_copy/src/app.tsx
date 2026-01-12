import {type ChangeEvent, useEffect, useMemo, useState} from "react"
import type {LibraryColor} from "@penpot/plugin-types";
import {clone, debounce} from "radash";

type UnoGroupColor = { group: string; list: string[] }

export function App() {
  const [groupLibColors, setGroupLibColors] = useState<Record<string, LibraryColor[]>>(() => ({}))
  const [searchState, setSearchState] = useState(() => ({
    group: '',
    text: '',
  }))
  const [resultSearchState, setResultSearchState] = useState(searchState)
  const unoColorGroupList = useMemo(() => toUnoColorGroupList(groupLibColors), [groupLibColors])
  const unoColorGroupListBySearch = useMemo(() => {
    const group = resultSearchState.group.trim()
    const text = resultSearchState.text.trim()

    if (!group.length && !text.length) return unoColorGroupList

    let result: UnoGroupColor[] = unoColorGroupList

    if (group.length) {
      result = result.filter(e => e.group === group)
    }

    if (text.length) {
      result = result.map(e => ({
        ...e,
        list: e.list.filter(f => f.includes(text)),
      }))
    }

    return result
  }, [unoColorGroupList, resultSearchState])

  useEffect(() => {
    window.addEventListener('message', (event: MessageEvent<UiMessage<MessageType>>) => {
      const msg = event.data

      if (msg.type === 'GET_CONNECTED_COLORS') {
        setGroupLibColors(msg.data)
      }
    })

    snedMessageToPenpot({ type: 'GET_CONNECTED_COLORS' })
  }, [])

  useEffect(() => {
    const d = debounce({ delay: 300 }, () => {
      setResultSearchState(searchState)
    })

    d()

    return d.cancel
  }, [searchState])

  function handleChangeInput (key: keyof typeof searchState) {
    return (ev: ChangeEvent<HTMLSelectElement> | ChangeEvent<HTMLInputElement>) => {
      setSearchState(e => ({ ...e, [key]: ev.target.value }))
    }
  }

  return <div className="min-h-screen min-w-full bg-white  text-black text-[12rem]">
    <div className="w-full flex items-center">
      <select value={searchState.group} onChange={handleChangeInput('group')}>
        <option value={''}>全部</option>
        {unoColorGroupList.map(e => {
          return <option key={e.group} value={e.group}>{e.group}</option>
        })}
      </select>
      <input type="text" placeholder={'請輸入篩選內容。 e.g. Aa01-Aa06, 首頁浮層相關色'} value={searchState.text} onChange={handleChangeInput('text')} />
    </div>
    <div className="w-full">
      {unoColorGroupListBySearch.map(e => {
        return (
          <div key={e.group}>
            <div className={'my-4 font-bold'}>{e.group}</div>
            {e.list.map(f => {
              return (
                <div key={f} className={'pl-16'}>{f}</div>
              )
            })}
          </div>
        )
      })}
    </div>
  </div>
}

function snedMessageToPenpot <T extends MessageType>(msg: PenpotMessage<T>) {
  parent.postMessage(msg, '*')
}

function toUnoColorGroupList (groupLibColors: Record<string, LibraryColor[]>) {
  const clonedGroupLibColors: Record<string, LibraryColor[]> = clone(groupLibColors)
  const result: UnoGroupColor[] = []
  Object.entries(clonedGroupLibColors).forEach(([k, e]) => {
    const sortedColors = sortColorNameList(e)
    const resultItem = { group: k, list: [] as string[] }

    sortedColors.forEach(e => {
      if (!e.name) return

      const isGradient = e.color != null && e.gradient?.stops != null
      if (isGradient) {
        e.gradient!.stops.forEach((f, i) => {
          resultItem.list.push(`${e.name}_${i + 1}: ${toColorValue(f)},${colorDoc(e.path)}`)
        })
      } else {
        resultItem.list.push(`${e.name}: ${toColorValue(e)},${colorDoc(e.path)}`)
      }
    })

    if (resultItem.list.length) result.push(resultItem)
  })

  return result

  function colorDoc (txt: string) {
    return emptyTxt(txt, '', { exists: txt => ` // ${txt}` })
  }

  function emptyTxt (txt: string, elseTxt: string, customizer = {} as {
    exists?: (txt: string) => string
    empty?: (txt: string) => string
  }) {
    if (!txt?.trim().length) return customizer.empty ? customizer.empty(elseTxt) : elseTxt
    return customizer.exists ? customizer.exists(txt) : txt
  }

  function toColorValue (color: { color?: string | null; opacity?: number | null }) {
    if (color.opacity != null) {
      if (color.opacity < 1) return `rgba('${color.color}', ${color.opacity})`
    }

    return color.color
  }
}

function sortColorNameList (colorList: LibraryColor[], {
  transformElement,
} = {} as { transformElement: (el: LibraryColor) => LibraryColor }) {
  const regex = /^([A-z]+)(\d+)/

  return colorList.sort((a, b) => {
    const _a = (transformElement ? transformElement(a) : a).name || ''
    const _b = (transformElement ? transformElement(b) : b).name || ''
    const matchA = _a.match(regex)
    const matchB = _b.match(regex)

    if (!matchA || !matchB) {
      return _a.localeCompare(_b)
    }

    const [_, prefixA, numA] = matchA // 分為前綴與數字
    const [__, prefixB, numB] = matchB

    if (prefixA !== prefixB) {
      // 比較字母前綴
      return prefixA.localeCompare(prefixB)
    }

    // 比較數字部分
    return parseInt(numA, 10) - parseInt(numB, 10)
  })
}