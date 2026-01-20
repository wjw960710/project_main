import { useState } from 'react'
import { createProvider } from '../../util/context.tsx'

export const { Provider: CounterProvider, useProvider: useCounter } = createProvider(() => {
	const [count, setCount] = useState({ value: 0 })
	return { count, setCount }
})
