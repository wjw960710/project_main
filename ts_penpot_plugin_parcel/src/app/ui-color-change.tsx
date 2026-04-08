import { useEffect, useMemo, useRef, useState } from 'react'
import { snedMessage } from '@/util/action-ui.ts'
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/shadcn-official/component-ui/combobox'
import { Button } from '@/shadcn-official/component-ui/button.tsx'
import { Checkbox } from '@/shadcn-official/component-ui/checkbox.tsx'

export function App() {
	const [connectedColors, setConnectedColors] = useState<UiConnectedColor[]>([])
	const [fromGroupIdx, setFromGroupIdx] = useState(-1)
	const [toGroupIdx, setToGroupIdx] = useState(-1)
	const [fromColorIdx, setFromColorIdx] = useState(-1)
	const [toColorIdx, setToColorIdx] = useState(-1)
	const [checkedSelection, setCheckedSelection] = useState(false)
	const [submitLoading, setSubmitLoading] = useState(false)
	const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const chooseValid = useMemo(() => {
		const baseResult = {
			disabled: true,
			isAllChange: false,
		}
		if (submitLoading) return baseResult
		if (fromGroupIdx === -1) return baseResult
		if (toGroupIdx === -1) return baseResult

		const colorChoose = [fromColorIdx, toColorIdx].reduce((p, e) => (e !== -1 ? p + 1 : p), 0)

		if (fromGroupIdx === toGroupIdx) {
			if (colorChoose < 2) return baseResult
		}

		if (colorChoose === 1) return baseResult

		return {
			...baseResult,
			disabled: false,
			isAllChange: colorChoose === 0,
		}
	}, [submitLoading, fromGroupIdx, fromColorIdx, toGroupIdx, toColorIdx])

	useEffect(() => {
		window.addEventListener('message', onMessage)

		snedMessage('GET_CONNECTED_COLORS2')

		return () => {
			window.removeEventListener('message', onMessage)
		}

		function onMessage(event: MessageEvent<UiMessage<MessageType>>) {
			const msg = event.data

			if (msg.type === 'GET_CONNECTED_COLORS2') {
				setConnectedColors(msg.data.filter(e => e.colors.length > 0))
			} else if (msg.type === 'CHANGE_ALL_ITEM_COLOR_START') {
				startLoadingTimeout(5 * 1000)
			}
		}
	}, [])

	function startLoadingTimeout(timeout: number = 15 * 1000) {
		if (loadingTimeoutRef.current != null) clearTimeout(loadingTimeoutRef.current)

		loadingTimeoutRef.current = setTimeout(() => {
			setSubmitLoading(false)
			loadingTimeoutRef.current = null
		}, timeout)
	}

	function changeAllItemColor() {
		// 替換庫全色
		if (chooseValid.isAllChange) {
			const toColorsMap = new Map<string /*name*/, number /*idx*/>()

			for (let i = 0; i < connectedColors[toGroupIdx].colors.length; i++) {
				const e = connectedColors[toGroupIdx].colors[i]
				toColorsMap.set(e.name, i)
			}

			for (let i = 0; i < connectedColors[fromGroupIdx].colors.length; i++) {
				const e = connectedColors[fromGroupIdx].colors[i]
				const toColorIdx = toColorsMap.get(e.name)
				if (toColorIdx != null) {
					changeOneColor(fromGroupIdx, i, toGroupIdx, toColorIdx)
				}
			}

			return
		}

		// 替換單色
		changeOneColor(fromGroupIdx, fromColorIdx, toGroupIdx, toColorIdx)

		function changeOneColor(
			fromGroupIdx: number,
			fromColorIdx: number,
			toGroupIdx: number,
			toColorIdx: number,
		) {
			snedMessage('CHANGE_ALL_ITEM_COLOR', {
				from: {
					groupId: connectedColors[fromGroupIdx].id,
					colorId: connectedColors[fromGroupIdx].colors[fromColorIdx].id,
					colorFileId: connectedColors[fromGroupIdx].colors[fromColorIdx].fileId,
				},
				to: {
					groupId: connectedColors[toGroupIdx].id,
					colorId: connectedColors[toGroupIdx].colors[toColorIdx].id,
					colorFileId: connectedColors[toGroupIdx].colors[toColorIdx].fileId,
				},
				isSelection: checkedSelection,
			})
		}
	}

	function handleChangeFromGroup(group: UiConnectedColor | null) {
		setFromColorIdx(-1)

		if (!group) {
			setFromGroupIdx(-1)
			return
		}

		setFromGroupIdx(connectedColors.findIndex(e => e.id === group.id))
	}

	function handleChangeFromColor(color: RealLibraryColor | null) {
		if (!color) {
			setFromColorIdx(-1)
			return
		}

		setFromColorIdx(connectedColors[fromGroupIdx].colors.findIndex(e => e.id === color.id))
	}

	function handleChangeToGroup(group: UiConnectedColor | null) {
		setToColorIdx(-1)

		if (!group) {
			setToGroupIdx(-1)
			return
		}

		setToGroupIdx(connectedColors.findIndex(e => e.id === group.id))
	}

	function handleChangeToColor(color: RealLibraryColor | null) {
		if (!color) {
			setToColorIdx(-1)
			return
		}

		setToColorIdx(connectedColors[toGroupIdx].colors.findIndex(e => e.id === color.id))
	}

	function handleStart() {
		if (chooseValid.disabled) return
		setSubmitLoading(true)
		startLoadingTimeout()

		changeAllItemColor()
	}

	function handleCheckedSelectionChange() {
		setCheckedSelection(!checkedSelection)
	}

	return (
		<>
			<div>被替換的顏色</div>

			<Combobox
				items={connectedColors}
				itemToStringLabel={(e: UiConnectedColor) => e.name}
				itemToStringValue={(e: UiConnectedColor) => e.id}
				value={connectedColors[fromGroupIdx] || undefined}
				onValueChange={handleChangeFromGroup}
			>
				<ComboboxInput placeholder="選擇資源群組" showClear />
				<ComboboxContent side={'top'}>
					<ComboboxEmpty>找不到資源群組</ComboboxEmpty>
					<ComboboxList>
						{(e: UiConnectedColor) => (
							<ComboboxItem key={e.name} value={e}>
								{e.name}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>

			{fromGroupIdx > -1 && (
				<Combobox
					items={connectedColors[fromGroupIdx].colors}
					itemToStringLabel={(e: RealLibraryColor) => e.name}
					itemToStringValue={(e: RealLibraryColor) => e.id}
					value={connectedColors[fromGroupIdx].colors[fromColorIdx] || undefined}
					onValueChange={handleChangeFromColor}
				>
					<ComboboxInput className={'mt-1'} placeholder="選擇色號" showClear />
					<ComboboxContent side={'top'}>
						<ComboboxEmpty>找不到色號</ComboboxEmpty>
						<ComboboxList>
							{(e: RealLibraryColor) => (
								<ComboboxItem key={e.name} value={e}>
									{e.name}
								</ComboboxItem>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
			)}

			<div className={'mt-2'}>替換的顏色</div>

			<Combobox
				items={connectedColors}
				itemToStringLabel={(e: UiConnectedColor) => e.name}
				itemToStringValue={(e: UiConnectedColor) => e.id}
				value={connectedColors[toGroupIdx] || undefined}
				onValueChange={handleChangeToGroup}
			>
				<ComboboxInput placeholder="選擇資源群組" showClear />
				<ComboboxContent side={'top'}>
					<ComboboxEmpty>找不到資源群組</ComboboxEmpty>
					<ComboboxList>
						{(e: UiConnectedColor) => (
							<ComboboxItem key={e.name} value={e}>
								{e.name}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>

			{toGroupIdx > -1 && (
				<Combobox
					items={connectedColors[toGroupIdx].colors}
					itemToStringLabel={(e: RealLibraryColor) => e.name}
					itemToStringValue={(e: RealLibraryColor) => e.id}
					value={connectedColors[toGroupIdx].colors[toColorIdx] || undefined}
					onValueChange={handleChangeToColor}
				>
					<ComboboxInput className={'mt-1'} placeholder="選擇色號" showClear />
					<ComboboxContent side={'top'}>
						<ComboboxEmpty>找不到色號</ComboboxEmpty>
						<ComboboxList>
							{(e: RealLibraryColor) => (
								<ComboboxItem key={e.name} value={e}>
									{e.name}
								</ComboboxItem>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
			)}

			<div className="flex mt-2">
				<Checkbox checked={checkedSelection} onCheckedChange={handleCheckedSelectionChange} />
				<div className={'ml-1 text-sm'}>是否只替換選中元素</div>
			</div>

			<Button className={'w-full mt-2'} onClick={handleStart} disabled={chooseValid.disabled}>
				{submitLoading ? (
					<div>
						替換中...請稍等
						<br />
						(替換內容太多會導致監控失效，請等待並用肉眼檢查)
					</div>
				) : chooseValid.isAllChange ? (
					'全數替換'
				) : (
					'替換'
				)}
			</Button>

			<ChangeLog />
		</>
	)
}

function ChangeLog() {
	const [msg, setMsg] = useState('')

	useEffect(() => {
		window.addEventListener('message', onMessage)

		return () => {
			window.removeEventListener('message', onMessage)
		}

		function onMessage(event: MessageEvent<UiMessage<MessageType>>) {
			const msg = event.data

			if (msg.type === 'CHANGE_ALL_ITEM_COLOR_START') {
				setMsg(msg.data)
			}
		}
	}, [])

	return <div className={'text-xs mt-2'}>{msg}</div>
}
