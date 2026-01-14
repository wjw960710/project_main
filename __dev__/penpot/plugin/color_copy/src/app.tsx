import { type ChangeEvent, type MouseEvent, useEffect, useMemo, useState } from 'react'
import type { LibraryColor } from '@penpot/plugin-types'
import { clone, debounce } from 'radash'
import { MAP_LIB_UI_GROUP_NAME, MAP_NAME } from './constant.ts'
import { HighlightedText } from './components/ui/highlighted-text.tsx'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select.tsx'
import { BsCopy, BsQuestionCircleFill } from 'react-icons/bs'
import { Input } from '@/components/ui/input.tsx'
import { toast, Toaster } from 'sonner'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible.tsx'
import { BsPlusLg } from 'react-icons/bs'
import { BsDashLg } from 'react-icons/bs'
import { copyToClipboard } from '@/helper.ts'

type UnoGroupColor = { group: string; list: string[] }

const MAP_SEARCH_VALUE = {
	allGroup: 'ALL',
}

export function App() {
	const [groupLibColors, setGroupLibColors] = useState<Record<string, LibraryColor[]>>(
		() => ({}),
	)
	const [collapsedGroup, setCollapsedGroup] = useState<Record<string, boolean>>({})
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
					const padMaxLen = from.length > 1 && from[0] === '0' ? 2 : 1

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

		snedMessage('GET_CONNECTED_COLORS')
	}, [])

	useEffect(() => {
		const d = debounce({ delay: 300 }, () => {
			setResultSearchState(searchState)
			setCollapsedGroup({})
		})

		d()

		return d.cancel
	}, [searchState])

	function handleChangeSearch(key: keyof typeof searchState) {
		return (ev: string | ChangeEvent<HTMLInputElement>) => {
			setSearchState(e => ({ ...e, [key]: typeof ev === 'string' ? ev : ev.target.value }))
		}
	}

	function handleCopyUnoGroupColorString(group: string) {
		return (ev: MouseEvent<SVGElement>) => {
			ev.stopPropagation()

			const unoColorGroup = dataBySearch.unoColorGroupList.find(e => e.group === group)
			if (!unoColorGroup) {
				toast.error(`找不到該群組顏色`)
				return
			}

			copyToClipboard(
				`{
  ${unoColorGroup.list.join('\n  ')}
}`,
				MAP_LIB_UI_GROUP_NAME[unoColorGroup.group] || unoColorGroup.group,
			)
		}
	}

	function handleCopyUnoColorString(idx: string, lineText: string) {
		return () => copyToClipboard(lineText, `${idx} 顏色`)
	}

	function handleOpenChange(group: string) {
		return () => {
			setCollapsedGroup(e => ({
				...e,
				[group]: collapsedGroup[group] == null ? false : !collapsedGroup[group],
			}))
		}
	}

	return (
		<div className="min-h-screen min-w-full bg-white text-[0.75rem] text-black">
			<Toaster richColors />
			<div className="w-full py-2 pr-2">
				<Select value={searchState.group} onValueChange={handleChangeSearch('group')}>
					<SelectTrigger className="w-full">
						<SelectValue />
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
				<div className="mt-1 flex w-full items-center">
					<Tooltip>
						<TooltipTrigger>
							<BsQuestionCircleFill className={'mx-1 text-lg'} />
						</TooltipTrigger>
						<TooltipContent>
							<p>
								可用 + 篩選多個條件(首字 & 為 and 篩選)。
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
					const isOpen = collapsedGroup[e.group] || collapsedGroup[e.group] == null
					let groupName = e.group
					let subGroupName = ''

					if (MAP_LIB_UI_GROUP_NAME[e.group]) {
						groupName = MAP_LIB_UI_GROUP_NAME[e.group]
						if (e.group !== MAP_NAME.libLocal) {
							subGroupName += e.group
						}
					}

					groupName += `(${e.list.length})`

					return (
						<Collapsible key={e.group} open={isOpen} onOpenChange={handleOpenChange(e.group)}>
							<CollapsibleTrigger asChild>
								<div className={'flex w-full cursor-pointer items-center pt-4 pb-2 font-bold'}>
									<div>
										{!!subGroupName && (
											<div className={'text-xs text-gray-400'}>| {subGroupName}</div>
										)}
										<div className={'flex items-center text-sm'}>
											{groupName}

											<BsCopy
												className={'ml-1 cursor-pointer'}
												onClick={handleCopyUnoGroupColorString(e.group)}
											/>
										</div>
									</div>

									<div className="ml-auto">{isOpen ? <BsDashLg /> : <BsPlusLg />}</div>
								</div>
							</CollapsibleTrigger>
							{e.list.map((f, j) => {
								const idx = String(j + 1).padStart(String(e.list.length).length, '0')

								return (
									<CollapsibleContent key={f} className={'pl-4'}>
										<span className={'mr-1 text-gray-400'}>
											<BsCopy
												className={'mr-1 inline cursor-pointer'}
												onClick={handleCopyUnoColorString(idx, f)}
											/>
											{idx}.
										</span>
										<HighlightedText text={f} highlights={dataBySearch.highlights} />
									</CollapsibleContent>
								)
							})}
						</Collapsible>
					)
				})}
			</div>
		</div>
	)
}

function snedMessage<T extends MessageType>(
	type: T,
	...args: PenpotMessage<T> extends { type: any; data: infer D } ? D extends undefined ? [] : [D] : []
) {
	parent.postMessage({ type, data: (args as any[])[0] }, '*')
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

			// region 尾註釋版本(後續可以考慮看看要不要修化成這樣)
			if (isGradient) {
				e.gradient!.stops.forEach((f, i) => {
					resultItem.list.push(`${e.name}_${i + 1}: ${toColorValue(f)},${colorDoc(e.path)}`)
				})
			} else {
				resultItem.list.push(`${e.name}: ${toColorValue(e)},${colorDoc(e.path)}`)
			}
			// endregion
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

		return `'${color.color}'`
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
