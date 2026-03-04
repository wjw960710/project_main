import * as b from './actions'
import {Context} from "./context";

const state : Context = {
	count: 0,
	...b,
}

