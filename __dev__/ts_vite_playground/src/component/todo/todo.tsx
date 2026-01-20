import { todoContext } from './context.ts'
import { type ChangeEvent, type KeyboardEvent, useContext, useState } from 'react'

export function Todo() {
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
			<TodoContent />
		</todoContext.Provider>
	)
}

function TodoContent() {
	const { input, list, handleInput, handleCreate, create } = useContext(todoContext)

	return (
		<div>
			<input type="text" value={input} onChange={handleInput} onKeyUp={handleCreate} />
			<button onClick={create}>創建</button>
			<ul>
				{list.value?.map(e => (
					<li key={e.name}>{e.name}</li>
				))}
			</ul>
		</div>
	)
}
