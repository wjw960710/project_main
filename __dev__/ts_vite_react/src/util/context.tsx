import {createContext, type ReactNode, useContext} from "react";

export function createProvider<OV, T>(createValue: (otherValue: OV) => T) {
  const ctx = createContext(null as T)

  function useProvider(): T {
    return useContext(ctx)
  }

  function Provider({
                      children,
                      otherValue,
                    }: {
    children: ReactNode
  } & (OV extends Record<string, any> ? { otherValue: OV } : { otherValue?: OV })) {
    return <ctx.Provider value={createValue(otherValue as OV)}>{children}</ctx.Provider>
  }

  return {
    Provider,
    useProvider,
  }
}