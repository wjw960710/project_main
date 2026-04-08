import { type KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { snedMessage } from '@/util/action-ui.ts'
import type { Fill, Shadow, Shape, Stroke } from '@penpot/plugin-types'
import { rgba } from 'polished'
import { Input } from '@/shadcn-official/component-ui/input.tsx'

let timer: ReturnType<typeof setTimeout> | undefined

type ColorItemType = 'fill' | 'stroke' | 'shadow'
type ColorItem = {
	name: string
	metadata: Fill | Stroke | Shadow
	stops?: Array<PenpotColorStop>
	gradientType?: 'linear' | 'radial'
	type: ColorItemType
	color?: string
	opacity?: number
	style?: 'drop-shadow' | 'inner-shadow'
}

export function App() {
	const [colors, setColors] = useState<ColorItem[]>([])
	const [editIdx, setEditIdx] = useState(-1)

	useEffect(() => {
		window.addEventListener('message', onMessage)

		snedMessage('SELECTION_FLAT_INFO')

		return () => {
			window.removeEventListener('message', onMessage)
			if (timer != null) clearTimeout(timer)
		}

		function onMessage(event: MessageEvent<UiMessage<MessageType>>) {
			const msg = event.data

			if (msg.type === 'SELECTION_CHANGE') {
				snedMessage('SELECTION_FLAT_INFO')
			} else if (msg.type === 'SELECTION_FLAT_INFO') {
				lazyDo(() => updateColors(msg.data.shapes))
			}
		}

		function updateColors(shapes: Shape[]) {
			const result: ColorItem[] = []

			shapes.forEach(shape => {
				if (Array.isArray(shape.fills)) {
					shape.fills.forEach(fill => {
						if (fill.fillColorRefId || fill.fillColorRefFile) return

						if (fill.fillColorGradient) {
							result.push({
								name: shape.name,
								metadata: fill,
								stops: fill.fillColorGradient.stops,
								gradientType: fill.fillColorGradient.type,
								type: 'fill',
							})
						} else {
							result.push({
								name: shape.name,
								metadata: fill,
								color: fill.fillColor,
								opacity: fill.fillOpacity,
								type: 'fill',
							})
						}
					})
				}

				if (Array.isArray(shape.strokes)) {
					shape.strokes.forEach(stroke => {
						if (stroke.strokeColorRefId || stroke.strokeColorRefFile) return

						if (stroke.strokeColorGradient) {
							result.push({
								name: shape.name,
								metadata: stroke,
								stops: stroke.strokeColorGradient.stops,
								gradientType: stroke.strokeColorGradient.type,
								type: 'stroke',
							})
						} else {
							result.push({
								name: shape.name,
								metadata: stroke,
								color: stroke.strokeColor,
								opacity: stroke.strokeOpacity,
								type: 'stroke',
							})
						}
					})
				}

				if (Array.isArray(shape.shadows)) {
					shape.shadows.forEach(shadow => {
						if (!shadow.color) return

						if (
							shadow.color.fileId ||
							shadow.color.id ||
							shadow.color.refId ||
							shadow.color.refFile
						)
							return

						result.push({
							name: shape.name,
							metadata: shadow,
							color: shadow.color.color,
							opacity: shadow.color.opacity,
							style: shadow.style,
							type: 'shadow',
						})
					})
				}
			})

			console.log(shapes)
			console.log(result)
			setColors(result)
		}
	}, [])

	useEffect(() => {
		setEditIdx(-1)
	}, [colors])

	function toggleEdit(idx: number) {
		setEditIdx(idx)
	}

	function handleToggleEdit(idx: number) {
		return () => toggleEdit(idx)
	}

	function save(idx: number, value: string) {
		if (!value?.trim().length) return

		setColors(e => {
			const newColors = [...e]
			newColors.splice(idx, 1)
			return newColors
		})

		snedMessage('CREATE_LIB_COLOR', {
			name: value,
			color: colors[idx].metadata,
		})

		toggleEdit(-1)
	}

	function handleSave(idx: number) {
		return (event: KeyboardEvent<HTMLInputElement>) => {
			const key = event.key
			if (key === 'Enter') {
				const value = event.currentTarget.value
				save(idx, value)
			} else if (key === 'Escape') {
				toggleEdit(-1)
			}
		}
	}

	return (
		<>
			{colors.length
				? colors.map((e, i) => {
						const colors = e.stops || { color: e.color!, opacity: e.opacity }
						const isEdit = editIdx === i

						return (
							<div key={i} className={'flex items-center mt-1'}>
								<ColorIcon colors={colors} />
								<div className="flex-1">
									{isEdit ? (
										<Input
											className={'w-full'}
											type="text"
											placeholder="請輸入資源名稱(ENTER 編輯; ESC 取消)"
											autoFocus
											onKeyUp={handleSave(i)}
										/>
									) : (
										<ColorText colors={colors} type={e.type} onClick={handleToggleEdit(i)} />
									)}
								</div>
							</div>
						)
					})
				: '請框選元素'}
		</>
	)
}

function ColorText({
	colors,
	type,
	onClick,
}: {
	colors: Omit<PenpotColorStop, 'offset'> | Omit<PenpotColorStop, 'offset'>[]
	type: ColorItemType
	onClick?: () => void
}) {
	const name = useMemo(() => {
		const colorName = (color: Omit<PenpotColorStop, 'offset'>) =>
			`${color.color}${color.opacity && color.opacity < 1 ? ` (${color.opacity * 100}%)` : ''}`

		if (Array.isArray(colors)) {
			return colors.map(color => colorName(color)).join(' - ')
		}

		return colorName(colors)
	}, [colors])

	return (
		<div className={'text-sm cursor-pointer'} onClick={onClick}>
			<div>{name}</div>
			<div>{type}</div>
		</div>
	)
}

function hexToRgba(color: Omit<PenpotColorStop, 'offset'>): string {
	if (!color.color) return ''

	if (color.opacity != null) {
		return rgba(color.color, color.opacity)
	}

	return color.color
}

function ColorIcon({
	colors,
}: {
	colors: Omit<PenpotColorStop, 'offset'> | Omit<PenpotColorStop, 'offset'>[]
}) {
	let rgbaList: string[] = []

	if (Array.isArray(colors)) {
		rgbaList = colors.map(color => hexToRgba(color))
	} else if (colors) {
		rgbaList.push(hexToRgba(colors))
	}

	return (
		<div
			className={
				'relative inline-flex rounded-sm overflow-hidden w-8 h-8 mr-3 border-solid border-2 border-neutral-400 dark:border-neutral-700'
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

function lazyDo(callback: () => void) {
	if (timer != null) clearTimeout(timer)
	timer = setTimeout(() => {
		callback()
	}, 500)
}
