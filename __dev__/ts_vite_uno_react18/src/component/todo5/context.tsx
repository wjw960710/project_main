import { type ChangeEvent, createContext, type FC, type KeyboardEvent, useState } from 'react'

export const todoContext = createContext<{
	input: string
	list: { value?: { name: string }[] }
	handleInput: (ev: ChangeEvent<HTMLInputElement>) => void
	handleCreate: (ev: KeyboardEvent<HTMLInputElement>) => void
	create: () => void
}>(null!)

export const TodoProvider = (Element: FC) => () => {
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

	return (
		<todoContext.Provider
			value={{
				input,
				list,
				handleInput,
				handleCreate,
				create,
			}}
		>
			<Element />
		</todoContext.Provider>
	)
}
