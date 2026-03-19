import { FetchpCacheCallCaches, FetchpCacheCallOptions } from '@pkg/fetchp/fetchp.type.ts'

let caches: FetchpCacheCallCaches | undefined

export async function cacheCall<R = any>({
	id,
	call: fn,
	caches: pCaches,
	ignoreCache,
	updateCache,
	remove,
}: FetchpCacheCallOptions<R>): Promise<R> {
	const _cacheResponses = pCaches || caches || (caches = new Map())

	if (remove) {
		_cacheResponses.delete(id)
	} else {
		const cacheRes = _cacheResponses.get(id)
		if (updateCache) {
			const newCacheRes = await updateCache(cacheRes)
			_cacheResponses.set(id, newCacheRes)
			return newCacheRes
		}
		if (cacheRes) return cacheRes
	}

	const res = await fn()
	if (ignoreCache) {
		if (await ignoreCache(res)) _cacheResponses.set(id, res)
	} else {
		_cacheResponses.set(id, res)
	}
	return res
}
