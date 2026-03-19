import { FetchpCacheCallCaches, FetchpCacheCallOptions } from '@pkg/fetchp/fetchp.type.ts'

let caches: FetchpCacheCallCaches | undefined

// TODO 清除緩存與更新緩存機制
export async function cacheCall<R = any>({
	id,
	call: fn,
	beforeCache,
	caches: pCaches,
}: FetchpCacheCallOptions<R>): Promise<R> {
	const _cacheResponses = pCaches || caches || (caches = new Map())

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
