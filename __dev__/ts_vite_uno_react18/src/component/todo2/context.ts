import { createProvider } from '../../util/context.tsx'
import { type ChangeEvent, type KeyboardEvent, useState } from 'react'

export const { Provider: TodoProvider, useProvider: useTodo } = createProvider(() => {
	const [input, setInput] = useState('')
	const [list, setList] = useState<{ value?: { name: string }[] }>({})

	function handleInput(ev: ChangeEvent<HTMLInputElement>) {
		setInput(ev.target.value)
	}

	function handleCreate(ev: KeyboardEvent<HTMLInputElement>) {
		if (ev.key !== 'Enter') return
		create()
	}

	function create() {
		if (!input) return
		if (list.value?.some(e => e.name === input)) return
		setList(e => ({
			value: [...(e.value || []), { name: input }],
		}))
		setInput('')
	}

	return {
		input,
		list,
		handleInput,
		handleCreate,
		create,
	}
})
