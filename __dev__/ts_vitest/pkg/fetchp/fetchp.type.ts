export type FetchpParams = {
	params?: Record<string, string | number>
	pathParams?: Record<string, string>
	bodyJson?: Record<string, any>
	bodyFormData?: FormData
	bodyUrlEncoded?: URLSearchParams
}

export type FetchpUrlTransform = { method: string; url: string; cache: true }

export type FetchpMergeId = string | number | symbol
