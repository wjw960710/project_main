import type { FetchpMergeId } from '@pkg/fetchp/fetchp.type.ts'

export const cacheCalls = new Map<FetchpMergeId, Promise<any>>()

export async function mergeCall<R>(id: FetchpMergeId, fn: () => Promise<R>) {
	let cachePromise = cacheCalls.get(id)
	if (cachePromise) return cachePromise

	cacheCalls.set(id, (cachePromise = fn()))
	const res = await cachePromise
	cacheCalls.delete(id)
	return res
}

export function mergeId(
	...args: (undefined | null | string | number | Record<string, string | number>)[]
) {
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
