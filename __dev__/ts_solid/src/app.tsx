import { Component, createSignal } from 'solid-js'

export const App: Component = () => {
	const [count, setCount] = createSignal(0)
	function increment() {
		setCount(prev => prev + 1)
	}

	return (
		<div class={'text-8 flex flex-col w-full h-screen items-center justify-center'}>
			<div class={'font-bold'}>{count()}</div>
			<button class={'cursor-pointer text-4'} onClick={increment}>
				increment {Math.random()}
			</button>
		</div>
	)
}
