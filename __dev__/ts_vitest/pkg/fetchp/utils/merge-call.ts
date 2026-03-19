import type {
	FetchpMergeArg,
	FetchpMergeCallCaches,
	FetchpMergeCallOptions,
} from '@pkg/fetchp/fetchp.type.ts'

let caches: FetchpMergeCallCaches | undefined

export async function mergeCall<R = any>({
	id,
	call,
	caches: pCaches,
}: FetchpMergeCallOptions<R>): Promise<R> {
	const _cacheCalls = pCaches || caches || (caches = new Map())

	let cachePromise = _cacheCalls.get(id)
	if (cachePromise) return cachePromise

	_cacheCalls.set(id, (cachePromise = call()))
	const res = await cachePromise
	_cacheCalls.delete(id)
	return res
}

export function mergeId(...args: FetchpMergeArg[]) {
	let id = ''

	for (let i = 0; i < args.length; i++) {
		const e = args[i]
		if (e == null) continue

		if (typeof e === 'object') {
			for (let k in e) {
				id += e[k]
			}
			continue
		}

		id += e
	}

	return id
}
