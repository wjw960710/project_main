// instance
export type FetchpParams = {
	params?: Record<string, string | number>
	pathParams?: Record<string, string>
	bodyJson?: Record<string, any>
	bodyFormData?: FormData
	bodyUrlEncoded?: URLSearchParams
}

// transform-url.ts
export type FetchpTransformUrlCacheItem = {
	method: string
	url?: string // 表示沒有 dynamicParams 的，可以直接取完整 url 而不再拼接
	urls: (string | undefined)[]
	dynamicParams?: Map<number, string>
}
export type FetchpTransformUrlCaches = Map<string, FetchpTransformUrlCacheItem>
export type FetchpTransformUrlResult = {
	method: string
	url: string
}
export type FetchpTransformUrlOptions = {
	url: string
	pathParams?: Record<string, string>
	caches?: FetchpTransformUrlCaches
}

// merge-call.ts
export type FetchpMergeId = string | number | symbol
export type FetchpMergeCallCaches = Map<FetchpMergeId, Promise<any>>
export type FetchpMergeArg =
	| undefined
	| null
	| string
	| number
	| Record<string, string | number>
export type FetchpMergeCallOptions<R = any> = {
	id: FetchpMergeId
	call: () => Promise<R>
	caches?: FetchpMergeCallCaches
}

// cache-call.ts
export type FetchpCacheId = FetchpMergeId
export type FetchpCacheCallCaches = Map<FetchpMergeId, any>
export type FetchpCacheCallOptions<R = any> = {
	id: FetchpMergeId
	call: () => Promise<R>
	beforeCache?: (res: R) => Promise<boolean> | boolean
	caches?: FetchpCacheCallCaches
}
