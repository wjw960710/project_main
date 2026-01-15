import { useEffect, useState } from 'react'

export function App() {
	const [count, setCount] = useState(0)
	const [msgCount, setMsgCount] = useState(count)

	useEffect(() => {
		window.addEventListener('message', (event: MessageEvent<UiMessage<MessageType>>) => {
			onMessage(event, 'COUNT', _event => {
				setMsgCount(_event.data.data)
			})
		})
	}, [])

	function updateCount() {
		const newCount = count + 1
		setCount(newCount)
		snedMessage('COUNT', newCount)
	}

	return (
		<div className="flex min-h-screen min-w-full flex-wrap content-center items-center justify-center bg-white">
			<div className="w-full text-center text-[36rem] font-bold">
				Welcome plugin with React-TS and Tailwindcss!
			</div>
			<div className={'text-center text-[32rem] text-black'}>
				<div className={'cursor-pointer'} onClick={updateCount}>
					From UI: {count}
				</div>
				<div className={'cursor-pointer'} onClick={updateCount}>
					From Penpot: {msgCount}
				</div>
			</div>
		</div>
	)
}

function snedMessage<T extends MessageType>(
	type: T,
	...args: PenpotMessage<T> extends { type: any; data: infer D }
		? D extends undefined
			? []
			: [D]
		: []
) {
	parent.postMessage(
		{
			type,
			data: (args as any[])[0],
		},
		'*',
	)
}

function onMessage<T extends MessageType>(
	event: MessageEvent<UiMessage<T>>,
	type: T,
	callback: (event: MessageEvent<UiMessage<T>>) => void,
) {
	if (event.data.type === type) {
		callback(event)
	}
}
