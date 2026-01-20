import { counterContext } from './context'
import { useContext, useState } from 'react'

export function Counter() {
	const [count, setCount] = useState({ value: 0 })

	return (
		<counterContext.Provider
			value={{
				count,
				setCount,
			}}
		>
			<CounterContent />
		</counterContext.Provider>
	)
}

function CounterContent() {
	const { count, setCount } = useContext(counterContext)

	function handleClick() {
		setCount(e => ({ ...e, value: e.value + 1 }))
	}

	return (
		<div className={'cursor-pointer text-center text-24 select-none'} onClick={handleClick}>
			{count.value}
		</div>
	)
}
