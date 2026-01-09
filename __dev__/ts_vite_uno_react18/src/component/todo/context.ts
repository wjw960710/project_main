import {type ChangeEvent, createContext, type KeyboardEvent} from "react";

export const todoContext = createContext<{
  input: string
  list: {value?: { name: string }[]}
  handleInput: (ev: ChangeEvent<HTMLInputElement>) => void
  handleCreate: (ev: KeyboardEvent<HTMLInputElement>) => void
  create: () => void
}>(null!)