import {TodoProvider, useTodo} from "./context.ts";

export function Todo2 () {
  return <TodoProvider>
    <TodoContent />
  </TodoProvider>
}

function TodoContent () {
  const { input, list, handleInput, handleCreate, create } = useTodo()

  return <div>
    <input type="text" value={input} onChange={handleInput} onKeyUp={handleCreate} />
    <button onClick={create}>創建</button>
    <ul>
      {list.value?.map(e => <li key={e.name}>{e.name}</li>)}
    </ul>
  </div>
}