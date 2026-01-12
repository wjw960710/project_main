import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import type { LibraryColor } from '@penpot/plugin-types'
import { clone, debounce } from 'radash'
import { MAP_LIB_GROUP_NAME, MAP_LIB_UI_GROUP_NAME, MAP_NAME } from './constant.ts'
import { HighlightedText } from './components/ui/highlighted-text.tsx'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select.tsx'
import { BsQuestionCircleFill } from 'react-icons/bs'
import { BsCopy } from 'react-icons/bs'
import { Input } from '@/components/ui/input.tsx'
import { Toaster, toast } from 'sonner'

type UnoGroupColor = { group: string; list: string[] }

const MAP_SEARCH_VALUE = {
	allGroup: 'ALL',
}

export function App() {
	const [groupLibColors, setGroupLibColors] = useState<Record<string, LibraryColor[]>>(
		() => ({}),
	)
	const [searchState, setSearchState] = useState(() => ({
		group: MAP_SEARCH_VALUE.allGroup,
		text: '',
	}))
	const [resultSearchState, setResultSearchState] = useState(searchState)
	const unoColorGroupList = useMemo(() => toUnoColorGroupList(groupLibColors), [groupLibColors])
	const dataBySearch = useMemo(() => {
		let group = resultSearchState.group.trim()
		if (group === MAP_SEARCH_VALUE.allGroup) group = ''

		let text = resultSearchState.text.trim()
		let isTextAnd = false
		if (text[0] === '&') {
			text = text.substring(1)
			isTextAnd = true
		}

		if (!group.length && !text.length)
			return {
				highlights: [] as string[],
				unoColorGroupList,
			}

		let result = {
			highlights: [] as string[],
			unoColorGroupList,
		}

		if (group.length) {
			result.unoColorGroupList = result.unoColorGroupList.filter(e => e.group === group)
		}

		if (text.length) {
			const words = text.split('+').map(e => e.trim())
			const highlights = [] as string[]
			for (let i = 0; i < words.length; i++) {
				const word = words[i]
				if (!word.length) continue

				const [rangeWord, code, from, , to] =
					word.match(/^([A-z]+)([0-9]+)-([A-z]+)?([0-9]+)$/) || []
				if (rangeWord) {
					const nFrom = Number(from)
					const nTo = Number(to)

					if (isNaN(nFrom) || isNaN(nTo)) continue

					const start = Math.min(nFrom, nTo)
					const end = Math.max(nFrom, nTo)
					const padMaxLen = (from.length > 1 && from[0] === '0') ? 2 : 1

					for (let j = start; j <= end; j++) {
						highlights.push(`${code}${String(j).padStart(padMaxLen, '0')}`)
					}
				} else {
					highlights.push(word)
				}
			}

			result.highlights = highlights
			result.unoColorGroupList = result.unoColorGroupList
				.map(e => {
					const newList = e.list.filter(f => {
						return highlights[isTextAnd ? 'every' : 'some'](g => f.includes(g))
					})
					return {
						...e,
						list: newList,
					}
				})
				.filter(e => e.list.length > 0)
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

	function handleChangeSearch(key: keyof typeof searchState) {
		return (ev: string | ChangeEvent<HTMLInputElement>) => {
			setSearchState(e => ({ ...e, [key]: typeof ev === 'string' ? ev : ev.target.value }))
		}
	}

	function handleCopyUnoColorString(group: string) {
		return () => {
			const unoColorGroup = dataBySearch.unoColorGroupList.find(e => e.group === group)
			if (!unoColorGroup) {
				toast.error('找不到顏色群組')
				return
			}

			const textArea = document.createElement('textarea')
			textArea.value = `{
  ${unoColorGroup.list.join('\n  ')}
}`
			document.body.appendChild(textArea)
			textArea.select()
			try {
				document.execCommand('copy')
				toast.success('複製群組顏色成功')
			} catch (error) {
				console.error(error)
				toast.error('複製群組顏色異常')
			}
			document.body.removeChild(textArea)
		}
	}

	return (
		<div className="min-h-screen min-w-full bg-white text-[0.75rem] text-black">
			<Toaster richColors />
			<div className="w-full py-2 pr-2">
				<Select value={searchState.group} onValueChange={handleChangeSearch('group')}>
					<SelectTrigger size={'sm'} className="w-full">
						<SelectValue placeholder="Theme" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={MAP_SEARCH_VALUE.allGroup}>全部</SelectItem>
						{unoColorGroupList.map(e => {
							return (
								<SelectItem key={e.group} value={e.group}>
									{MAP_LIB_UI_GROUP_NAME[e.group] || e.group}
								</SelectItem>
							)
						})}
					</SelectContent>
				</Select>
				<div className="flex w-full mt-1 items-center">
					<Tooltip>
						<TooltipTrigger asChild>
							<BsQuestionCircleFill className={'mx-1 text-lg'} />
						</TooltipTrigger>
						<TooltipContent>
							<p>
								可用+篩選多個條件(首字 & 為 and 篩選)。
								<br />
								e.g. Aa01-Aa06, 首頁浮層相關色, com1-3+一般
							</p>
						</TooltipContent>
					</Tooltip>
					<Input
						className={'flex-1'}
						type="text"
						placeholder="請輸入篩選條件"
						value={searchState.text}
						onChange={handleChangeSearch('text')}
					/>
				</div>
			</div>
			<div className="w-full">
				{dataBySearch.unoColorGroupList.map(e => {
					return (
						<div key={e.group}>
							<div className={'mt-4 mb-2 flex items-center font-bold'}>
								{MAP_LIB_UI_GROUP_NAME[e.group]
									? `${MAP_LIB_UI_GROUP_NAME[e.group]}${e.group === MAP_NAME.libLocal ? '' : `(${e.group})`}`
									: e.group}
								<BsCopy
									className={'ml-1 cursor-pointer'}
									onClick={handleCopyUnoColorString(e.group)}
								/>
							</div>
							{e.list.map(f => {
								return (
									<div key={f} className={'pl-4'}>
										<HighlightedText text={f} highlights={dataBySearch.highlights} />
									</div>
								)
							})}
						</div>
					)
				})}
			</div>
		</div>
	)
}

function snedMessageToPenpot<T extends MessageType>(msg: PenpotMessage<T>) {
	parent.postMessage(msg, '*')
}

function toUnoColorGroupList(groupLibColors: Record<string, LibraryColor[]>) {
	const clonedGroupLibColors: Record<string, LibraryColor[]> = clone(groupLibColors)
	const result: UnoGroupColor[] = []
	Object.entries(clonedGroupLibColors).forEach(([k, e]) => {
		const sortedColors = sortColorNameList(e)
		const resultItem = { group: k, list: [] as string[] }

		sortedColors.forEach(e => {
			if (!e.name) return

			const isGradient = e.gradient?.stops != null
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

	function colorDoc(txt: string) {
		return emptyTxt(txt, '', { exists: txt => ` // ${txt}` })
	}

	function emptyTxt(
		txt: string,
		elseTxt: string,
		customizer = {} as {
			exists?: (txt: string) => string
			empty?: (txt: string) => string
		},
	) {
		if (!txt?.trim().length) return customizer.empty ? customizer.empty(elseTxt) : elseTxt
		return customizer.exists ? customizer.exists(txt) : txt
	}

	function toColorValue(color: { color?: string | null; opacity?: number | null }) {
		if (color.opacity != null) {
			if (color.opacity < 1) return `rgba('${color.color}', ${color.opacity})`
		}

		return color.color
	}
}

function sortColorNameList(
	colorList: LibraryColor[],
	{ transformElement } = {} as { transformElement: (el: LibraryColor) => LibraryColor },
) {
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
