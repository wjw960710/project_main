import { useState } from 'react'

export function createTmplTestContextValue() {
	const [count, setCount] = useState(0)

	function add() {
		setCount(e => e + 1)
	}

	function sub() {
		setCount(e => e - 1)
	}

	return {
		count,
		add,
		sub,
	}
}
