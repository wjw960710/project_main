export type FetchpMiddleware = (
	req: { input: RequestInfo | URL; init?: RequestInit },
	next: () => Promise<Response>,
) => Promise<Response>

export function createFetchp() {
	const middlewares: FetchpMiddleware[] = []

	const fetchp = async (input: RequestInfo | URL, init?: RequestInit) => {
		const dispatch = async (
			i: number,
			req: { input: RequestInfo | URL; init?: RequestInit },
		): Promise<Response> => {
			if (i === middlewares.length) {
				// 最後一個中間件執行原生 fetch
				return fetch(req.input, req.init)
			}

			const middleware = middlewares[i]
			return middleware(req, () => dispatch(i + 1, req))
		}

		return dispatch(0, { input, init })
	}

	// 允許動態添加中間件
	fetchp.use = (fn: FetchpMiddleware) => {
		middlewares.push(fn)
		return fetchp
	}

	return fetchp
}
