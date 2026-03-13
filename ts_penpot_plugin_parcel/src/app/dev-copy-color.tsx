import { type ChangeEvent, type MouseEvent, useEffect, useMemo, useState } from 'react'
import type { Gradient, LibraryColor } from '@penpot/plugin-types'
import { clone, debounce } from 'radash'
import { MAP_LIB_UI_GROUP_NAME, MAP_NAME } from '@/constant/color-copy.ts'
import { HighlightedText } from '@/shadcn-official/component-ui/highlighted-text.tsx'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/shadcn-official/component-ui/tooltip.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shadcn-official/component-ui/select.tsx'
import { BsCopy, BsDashLg, BsPlusLg, BsQuestionCircleFill } from 'react-icons/bs'
import { Input } from '@/shadcn-official/component-ui/input.tsx'
import { toast } from 'sonner'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/shadcn-official/component-ui/collapsible.tsx'
import { copyToClipboard, snedMessage } from '@/util/action-ui.ts'
import { sortColorNameList } from '@/util/color.ts'
import { Tabs, TabsList, TabsTrigger } from '@/shadcn/official/component-ui/tabs.tsx'

type GradientStop = Gradient['stops'][number]

type GroupColorListItem = {
	name: string
	path: string
	content: string
	stop?: GradientStop
	color?: LibraryColor
}

type GroupColor = {
	group: string
	list: GroupColorListItem[]
}

const MAP_SEARCH_VALUE = {
	allGroup: 'ALL',
}

const MODE_TAB = {
	dp: 'dp',
	ssUno: 'ssUno',
	ssCss: 'ssCss',
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
	const [modeTab, setModeTab] = useState(MODE_TAB.dp)
	const unoColorGroupList = useMemo(() => toViewList(groupLibColors), [groupLibColors])
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
						return highlights[isTextAnd ? 'every' : 'some'](g => f.content.includes(g))
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
			setSearchState(e => ({
				...e,
				[key]: typeof ev === 'string' ? ev : ev.target.value,
			}))
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
  ${transformColorTexts(unoColorGroup.list).join('\n  ')}
}`,
				MAP_LIB_UI_GROUP_NAME[unoColorGroup.group] || unoColorGroup.group,
			)
		}
	}

	function transformColorTexts<T extends GroupColorListItem | GroupColorListItem[]>(
		item: T,
	): T extends any[] ? string[] : string {
		const isArrTextParam = Array.isArray(item)
		const items = isArrTextParam ? item : [item]
		const result = [] as string[]

		items.forEach(e => {
			let content = e.content

			if (modeTab === MODE_TAB.dp) {
				content = toUnoColorString(e)
			} else if (modeTab === MODE_TAB.ssUno) {
				content = toSsUnoColorString(e)
			} else if (modeTab === MODE_TAB.ssCss) {
				content = toSsCssColorString(e)
			}

			result.push(content)
		})

		if (isArrTextParam) return result as any
		return result[0] || ('' as any)
	}

	function handleCopyUnoColorString(idx: string, lineItem: GroupColorListItem) {
		return () => copyToClipboard(transformColorTexts(lineItem), `${idx} 顏色`)
	}

	function handleOpenChange(group: string) {
		return () => {
			setCollapsedGroup(e => ({
				...e,
				[group]: collapsedGroup[group] == null ? false : !collapsedGroup[group],
			}))
		}
	}

	function handleExpandAll() {
		const result: Record<string, boolean> = {}

		dataBySearch.unoColorGroupList.forEach(e => {
			result[e.group] = true
		})

		setCollapsedGroup(result)
	}

	function handleCollapseAll() {
		const result: Record<string, boolean> = {}

		dataBySearch.unoColorGroupList.forEach(e => {
			result[e.group] = false
		})

		setCollapsedGroup(result)
	}

	function handleChangeModeTab(tab: string) {
		setModeTab(tab)
	}

	return (
		<div className="min-h-screen min-w-full text-[0.75rem] text-black dark:text-white">
			<div className="w-full pb-2">
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

			<div className="flex items-center">
				<div className={'mr-2'}>複製格式</div>
				<Tabs className={'mr-auto'} value={modeTab} onValueChange={handleChangeModeTab}>
					<TabsList>
						<TabsTrigger value={MODE_TAB.dp}>DP</TabsTrigger>
						<TabsTrigger value={MODE_TAB.ssUno}>SS UNO</TabsTrigger>
						<TabsTrigger value={MODE_TAB.ssCss}>SS CSS</TabsTrigger>
					</TabsList>
				</Tabs>
				<div className="ml-2">
					全
					<span className={'cursor-pointer'} onClick={handleExpandAll}>
						展開
					</span>
					/
					<span className={'cursor-pointer'} onClick={handleCollapseAll}>
						收合
					</span>
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
									<CollapsibleContent key={f.name} className={'pl-4'}>
										<span className={'mr-1 text-gray-400'}>
											<BsCopy
												className={'mr-1 inline cursor-pointer'}
												onClick={handleCopyUnoColorString(idx, f)}
											/>
											{idx}.
										</span>
										<HighlightedText text={f.content} highlights={dataBySearch.highlights} />
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

function toViewColorValue(color: { color?: string | null; opacity?: number | null }) {
	if (color.opacity != null) {
		if (color.opacity < 1) return `${color.color}(${color.opacity})`
	}

	return color.color
}

function toViewList(groupLibColors: Record<string, LibraryColor[]>) {
	const clonedGroupLibColors: Record<string, LibraryColor[]> = clone(groupLibColors)
	const result: GroupColor[] = []

	Object.entries(clonedGroupLibColors).forEach(([k, e]) => {
		const sortedColors = sortColorNameList(e)
		const resultItem = { group: k, list: [] } as GroupColor

		sortedColors.forEach(e => {
			if (!e.name) return

			const isGradient = e.gradient?.stops != null

			if (isGradient) {
				e.gradient!.stops.forEach((f, i) => {
					const name = `${e.name}_${i + 1}`
					resultItem.list.push({
						content: `${name} ﹍ ${toViewColorValue(f)} ﹍ ${e.path}`,
						name,
						path: e.path,
						stop: f,
					})
				})
			} else {
				const name = e.name
				resultItem.list.push({
					content: `${name} ﹍ ${toViewColorValue(e)} ﹍ ${e.path}`,
					name,
					path: e.path,
					color: e,
				})
			}
		})

		if (resultItem.list.length) result.push(resultItem)
	})

	return result
}

function toSsUnoColorString(groupColorListItem: GroupColorListItem): string {
	const { name, path } = groupColorListItem
	return `${name}: 'var(--color-${name})',${colorDoc(path)}`
}

function toSsCssColorString(groupColorListItem: GroupColorListItem): string {
	const { name, stop, color } = groupColorListItem

	if (stop) {
		return `--color-${name}: ${toCssVarText(stop)};`
	}

	return `--color-${name}: ${toCssVarText(color!)};`
}

function toUnoColorString(groupColorListItem: GroupColorListItem): string {
	const { name, path, stop, color } = groupColorListItem

	if (stop) {
		return `${name}: ${toColorValue(stop)},${colorDoc(path)}`
	}

	return `${name}: ${toColorValue(color!)},${colorDoc(path)}`

	function toColorValue(color: { color?: string | null; opacity?: number | null }) {
		if (color.opacity != null) {
			if (color.opacity < 1) return `rgba('${color.color}', ${color.opacity})`
		}

		return `'${color.color}'`
	}
}

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

function toCssVarText(color: { color?: string | null; opacity?: number | null }) {
	if (color.opacity != null && color.opacity < 1) {
		return hexToRgba(color.color!, color.opacity)
	}

	return color.color!
}

function hexToRgba(hex: string, alpha = 1) {
	/* 驗證透明度範圍 */
	if (alpha < 0) {
		alpha = 0
	} else if (alpha > 1) {
		alpha = 1
	}

	/* 移除開頭的 # */
	let normalizedHex = hex.replace(/^#/, '')

	/* 支援 3 碼 hex，例如 #fff */
	if (normalizedHex.length === 3) {
		normalizedHex = normalizedHex
			.split('')
			.map(char => char + char)
			.join('')
	}

	/* 驗證 hex 格式 */
	if (!/^[\da-fA-F]{6}$/.test(normalizedHex)) {
		throw new Error('hex 格式不正確，請使用 #RRGGBB 或 #RGB')
	}

	const r = Number.parseInt(normalizedHex.slice(0, 2), 16)
	const g = Number.parseInt(normalizedHex.slice(2, 4), 16)
	const b = Number.parseInt(normalizedHex.slice(4, 6), 16)

	return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
