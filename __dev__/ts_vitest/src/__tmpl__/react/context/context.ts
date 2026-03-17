import { createContext, useContext } from 'react'
import { createTmplTestContextValue } from '@/__tmpl__/react/context/instance'

export const tmplTestContext = createContext<ReturnType<typeof createTmplTestContextValue>>(
	null!,
)

export function useTmplTestContext() {
	return useContext(tmplTestContext)
}
