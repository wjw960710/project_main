import { useEffect, useState } from 'react'
import type { LibraryColor } from '@penpot/plugin-types'
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

export function App() {
	const [connectedColors, setConnectedColors] = useState<UiConnectedColor[]>([])
	const [fromGroupIdx, setFromGroupIdx] = useState(-1)
	const [toGroupIdx, setToGroupIdx] = useState(-1)
	const [fromColorIdx, setFromColorIdx] = useState(-1)
	const [toColorIdx, setToColorIdx] = useState(-1)

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
				console.log(msg.data.filter(e => e.colors.length > 0))
			}
		}
	}, [])

	function changeAllItemColor() {
		snedMessage('CHANGE_ALL_ITEM_COLOR', {
			from: [
				connectedColors[fromGroupIdx].id,
				connectedColors[fromGroupIdx].colors[fromColorIdx].id,
			],
			to: [connectedColors[toGroupIdx].id, connectedColors[toGroupIdx].colors[toColorIdx].id],
		})
	}

	function handleChangeFromGroup(group: UiConnectedColor | null) {
		setFromColorIdx(-1)

		if (!group) {
			setFromGroupIdx(-1)
			return
		}

		setFromGroupIdx(connectedColors.findIndex(e => e.id === group.id))
	}

	function handleChangeFromColor(color: LibraryColor | null) {
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

	function handleChangeToColor(color: LibraryColor | null) {
		if (!color) {
			setToColorIdx(-1)
			return
		}

		setToColorIdx(connectedColors[toGroupIdx].colors.findIndex(e => e.id === color.id))
	}

	function handleStart() {
		changeAllItemColor()
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
					itemToStringLabel={(e: LibraryColor) => e.name}
					itemToStringValue={(e: LibraryColor) => e.id}
					value={connectedColors[fromGroupIdx].colors[fromColorIdx] || undefined}
					onValueChange={handleChangeFromColor}
				>
					<ComboboxInput className={'mt-1'} placeholder="選擇色號" />
					<ComboboxContent side={'top'}>
						<ComboboxEmpty>找不到色號</ComboboxEmpty>
						<ComboboxList>
							{(e: LibraryColor) => (
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
					itemToStringLabel={(e: LibraryColor) => e.name}
					itemToStringValue={(e: LibraryColor) => e.id}
					value={connectedColors[toGroupIdx].colors[toColorIdx] || undefined}
					onValueChange={handleChangeToColor}
				>
					<ComboboxInput className={'mt-1'} placeholder="選擇色號" />
					<ComboboxContent side={'top'}>
						<ComboboxEmpty>找不到色號</ComboboxEmpty>
						<ComboboxList>
							{(e: LibraryColor) => (
								<ComboboxItem key={e.name} value={e}>
									{e.name}
								</ComboboxItem>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
			)}

			<Button
				className={'w-full mt-2'}
				onClick={handleStart}
				disabled={
					fromGroupIdx === -1 || fromColorIdx === -1 || toGroupIdx === -1 || toColorIdx === -1
				}
			>
				替換
			</Button>
		</>
	)
}
