import { FetchpCacheId, FetchpCacheResponses } from '@pkg/fetchp/fetchp.type.ts'

let cacheResponses: FetchpCacheResponses | undefined

export async function cacheCall<R>(
	id: FetchpCacheId,
	fn: () => Promise<R>,
	beforeCache?: (res: R) => Promise<boolean> | boolean,
	pcacheResponses?: FetchpCacheResponses,
) {
	const _cacheResponses = pcacheResponses || cacheResponses || (cacheResponses = new Map())

	const cacheRes = _cacheResponses.get(id)
	if (cacheRes) return cacheRes

	const res = await fn()
	if (beforeCache) {
		if (await beforeCache(res)) _cacheResponses.set(id, res)
	} else {
		_cacheResponses.set(id, res)
	}
	return res
}
