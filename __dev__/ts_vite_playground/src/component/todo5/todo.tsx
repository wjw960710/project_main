import { todoContext, TodoProvider } from './context.tsx'
import { useContext } from 'react'

export const Todo5 = TodoProvider(Todo)

function Todo() {
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
