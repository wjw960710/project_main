export type FetchpParams = {
	params?: Record<string, string>
	bodyJson?: Record<string, any>
	bodyFormData?: FormData
	bodyUrlEncoded?: URLSearchParams
}
