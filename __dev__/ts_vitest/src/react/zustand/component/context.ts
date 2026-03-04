import {createContext} from "react";
import type * as a from "./actions";

export type Context = {
	count: number
} & {
	[K in keyof typeof a]: (typeof a)[K]
}

export const context = createContext<Context>(null!)
