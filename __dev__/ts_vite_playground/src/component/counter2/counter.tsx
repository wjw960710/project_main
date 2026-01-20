import { CounterProvider, useCounter } from './context'

export function Counter2() {
	return (
		<CounterProvider>
			<CounterContent />
		</CounterProvider>
	)
}

function CounterContent() {
	const { count, setCount } = useCounter()

	function handleClick() {
		setCount(e => ({ ...e, value: e.value + 1 }))
	}

	return (
		<div className={'cursor-pointer text-center text-24 select-none'} onClick={handleClick}>
			{count.value}
		</div>
	)
}
