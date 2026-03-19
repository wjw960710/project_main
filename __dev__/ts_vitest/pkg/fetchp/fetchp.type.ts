// instance
export type FetchpParams = {
	params?: Record<string, string | number>
	pathParams?: Record<string, string>
	bodyJson?: Record<string, any>
	bodyFormData?: FormData
	bodyUrlEncoded?: URLSearchParams
}

// transform-url.ts
export type FetchpCacheUrl = {
	method: string
	url?: string // 表示沒有 dynamicParams 的，可以直接取完整 url 而不再拼接
	urls: (string | undefined)[]
	dynamicParams?: Map<number, string>
}
export type FetchpCacheUrls = Map<string, FetchpCacheUrl>
export type FetchpUrlTransform = {
	method: string
	url: string
}

// merge-call.ts
export type FetchpMergeCacheCalls = Map<FetchpMergeId, Promise<any>>
export type FetchpMergeId = string | number | symbol
