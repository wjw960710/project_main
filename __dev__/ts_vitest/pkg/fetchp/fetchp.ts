export type CreateFetchpOptions = {
	// 默認使用原生的 fetch，傳入的話就會換成對硬的請求函數
	engine?: (input: string | URL | Request, init?: RequestInit) => Response | Promise<Response>
	beforeFetch?: (input: string | URL | Request, init?: RequestInit) => Promise<void> // fetch 前執行
	afterFetch?: (res: Response) => Response | Promise<Response> // fetch 後執行
}

export function createFetchp(options?: CreateFetchpOptions) {
	const { engine, beforeFetch, afterFetch } = options || {}
	const _engine = engine || fetch

	return async function (input: string | URL | Request, init?: RequestInit) {
		if (beforeFetch) await beforeFetch(input, init)
		const res = await _engine(input, init)
		if (afterFetch) return afterFetch(res)
		return res
	}
}
