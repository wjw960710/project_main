import { PropsWithChildren } from 'react'
import { tmplTestContext } from '@/__tmpl__/react/context/context'
import { createTmplTestContextValue } from '@/__tmpl__/react/context/instance'

export function TmplTestProvider({ children }: PropsWithChildren) {
	return (
		<tmplTestContext.Provider value={createTmplTestContextValue()}>
			{children}
		</tmplTestContext.Provider>
	)
}
