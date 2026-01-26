import { type ChangeEvent, Fragment, type ReactNode, useEffect, useMemo, useState } from 'react'
import type { LibraryColor } from '@penpot/plugin-types'
import { snedMessage } from '@/util/action-ui.ts'
import { debounce } from 'radash'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shadcn-official/component-ui/select.tsx'
import { MAP_LIB_UI_GROUP_NAME } from '@/constant/color-copy.ts'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/shadcn-official/component-ui/tooltip.tsx'
import { BsDashLg, BsPlusLg, BsQuestionCircleFill } from 'react-icons/bs'
import { Input } from '@/shadcn-official/component-ui/input.tsx'
import { objMap } from '@/util/data.ts'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/shadcn-official/component-ui/collapsible.tsx'
import { HighlightedText } from '@/shadcn-official/component-ui/highlighted-text.tsx'
import { rgba } from 'polished'
import { sortColorNameList } from '@/util/color.ts'

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
				groupLibColors,
			}

		let result = {
			highlights: [] as string[],
			groupLibColors,
		}

		if (group.length) {
			const groupLibColors: Record<string, LibraryColor[]> = {}
			for (let key in result.groupLibColors) {
				const _group = key as keyof Record<string, LibraryColor[]>
				if (group === _group) {
					groupLibColors[_group] = result.groupLibColors[_group]
				}
			}
			result.groupLibColors = groupLibColors
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
			const groupLibColors: Record<string, LibraryColor[]> = {}
			for (let key in result.groupLibColors) {
				const group = key as keyof Record<string, LibraryColor[]>
				const newList = result.groupLibColors[group].filter(color => {
					return highlights[isTextAnd ? 'every' : 'some'](keyword =>
						color.name.includes(keyword),
					)
				})
				if (newList.length) groupLibColors[group] = newList
			}
			result.groupLibColors = groupLibColors
		}

		return result
	}, [groupLibColors, resultSearchState])

	useEffect(() => {
		window.addEventListener('message', (event: MessageEvent<UiMessage<MessageType>>) => {
			const msg = event.data

			if (msg.type === 'GET_CONNECTED_COLORS') {
				for (let key in msg.data) {
					const group = key as keyof Record<string, LibraryColor[]>
					msg.data[group] = sortColorNameList(msg.data[group])
				}
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

	function handleOpenChange(group: string) {
		return () => {
			setCollapsedGroup(e => ({
				...e,
				[group]: collapsedGroup[group] == null ? false : !collapsedGroup[group],
			}))
		}
	}

	function handleColorClick() {}

	return (
		<div className="min-h-screen min-w-full text-[0.75rem] text-black dark:text-white">
			<div className="w-full pb-2">
				<Select value={searchState.group} onValueChange={handleChangeSearch('group')}>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={MAP_SEARCH_VALUE.allGroup}>全部</SelectItem>
						{objMap(groupLibColors, group => {
							return (
								<SelectItem key={group} value={group}>
									{MAP_LIB_UI_GROUP_NAME[group] || group}
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
				{objMap(dataBySearch.groupLibColors, (group, list) => {
					const isOpen = collapsedGroup[group] || collapsedGroup[group] == null
					let groupName = group

					if (MAP_LIB_UI_GROUP_NAME[group]) {
						groupName = MAP_LIB_UI_GROUP_NAME[group]
					}

					groupName += `(${list.length})`

					return (
						<Collapsible key={group} open={isOpen} onOpenChange={handleOpenChange(group)}>
							<CollapsibleTrigger asChild>
								<div className={'flex w-full cursor-pointer items-center pt-4 pb-2 font-bold'}>
									<div className={'flex items-center text-sm'}>{groupName}</div>

									<div className="ml-auto">{isOpen ? <BsDashLg /> : <BsPlusLg />}</div>
								</div>
							</CollapsibleTrigger>
							{list.map(color => (
								<CollapsibleContent
									key={color.id}
									className="cursor-pointer my-2 pl-4 flex items-center"
									onClick={handleColorClick}
								>
									<ColorIcon color={color} />
									<HighlightedText text={color.name} highlights={dataBySearch.highlights} />
									<HexText color={color} />
								</CollapsibleContent>
							))}
						</Collapsible>
					)
				})}
			</div>
		</div>
	)
}

function transformOpacityText(opacity: number | undefined) {
	if (opacity == null) return ''
	return ` (${opacity * 100}%)`
}

function HexText({ color }: { color: LibraryColor }) {
	let node: ReactNode
	if (color.color) {
		node = `${color.color}${transformOpacityText(color.opacity)}`
	} else if (color.gradient?.stops.length) {
		const { stops } = color.gradient
		node = stops.map((stopColor, index) => (
			<Fragment key={stopColor.offset}>
				{index > 0 && ' - '}
				{stopColor.color}
				{transformOpacityText(stopColor.opacity)}
			</Fragment>
		))
	}

	if (node) {
		return <span className={'ml-1 opacity-50'}>{node}</span>
	}

	return null
}

function hexToRgba(color: Pick<LibraryColor, 'color' | 'opacity'>): string {
	if (!color.color) return ''

	if (color.opacity != null) {
		return rgba(color.color, color.opacity)
	}

	return color.color
}

function ColorIcon({ color }: { color: LibraryColor }) {
	let rgbaList: string[] = []

	if (color.color) {
		rgbaList.push(hexToRgba(color))
	} else if (color.gradient?.stops.length) {
		const { stops } = color.gradient
		rgbaList = stops.map(stopColor => hexToRgba(stopColor))
	}

	return (
		<div
			className={
				'relative inline-flex rounded-[100px] overflow-hidden w-4 h-4 mr-2 border-solid border border-neutral-50 dark:border-neutral-700'
			}
		>
			{rgbaList.map((rgba, i) => {
				const width = 100 / rgbaList.length
				return (
					<div
						key={i}
						className={'absolute top-0 h-full'}
						style={{ left: `${width * i}%`, width: `${width}%`, backgroundColor: rgba }}
					/>
				)
			})}
		</div>
	)
}
