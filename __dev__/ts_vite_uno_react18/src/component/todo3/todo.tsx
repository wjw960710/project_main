import {todoContext, useContextValue} from "./context.ts";
import {useContext} from "react";

export function Todo3 () {
  const contextValue = useContextValue()

  return <todoContext.Provider value={contextValue}>
    <TodoContent />
  </todoContext.Provider>
}

function TodoContent () {
  const { input, list, handleInput, handleCreate, create } = useContext(todoContext)

  return <div>
    <input type="text" value={input} onChange={handleInput} onKeyUp={handleCreate} />
    <button onClick={create}>創建</button>
    <ul>
      {list.value?.map(e => <li key={e.name}>{e.name}</li>)}
    </ul>
  </div>
}