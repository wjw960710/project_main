import {type ChangeEvent, createContext, type KeyboardEvent, type ReactNode, useContext, useState} from "react";

const todoContext = createContext<ReturnType<typeof useContextValue>>(null!)

export function TodoProvider ({ children}: {children: ReactNode}) {
  const contextValue = useContextValue()
  return <todoContext.Provider value={contextValue}>
      {children}
    </todoContext.Provider>
}

export function useTodoContext () {
  return useContext(todoContext)
}

function useContextValue () {
  const [input, setInput] = useState('')
  const [list, setList] = useState<{value?: { name: string }[]}>({})

  function handleInput (ev: ChangeEvent<HTMLInputElement>) {
    setInput(ev.target.value)
  }

  function handleCreate (ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key !== 'Enter') return
    create()
  }

  function create () {
    if (!input) return
    if (list.value?.some(e => e.name === input)) return
    setList(e => ({
      value: [...e.value || [], {name: input}]
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
}