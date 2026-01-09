import {createContext, type Dispatch, type SetStateAction} from "react";

export type Count = {
  value: number
}

export type CounterContext = {
  count: Count
  setCount: Dispatch<SetStateAction<Count>>
}

export const counterContext = createContext<CounterContext>(null!)