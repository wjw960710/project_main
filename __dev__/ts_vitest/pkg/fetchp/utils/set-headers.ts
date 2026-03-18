import { FetchpParams } from '@pkg/fetchp/fetchp.type.ts'

export function setHeadersContentType(init: RequestInit, params: FetchpParams) {
	if (!params) return
	if (!(params.bodyJson || params.bodyFormData || params.bodyUrlEncoded)) return

	if (!init.headers) init.headers = new Headers()

	if (params.bodyJson) setHeaders(init.headers, 'Content-Type', 'application/json')
	else if (params.bodyFormData) setHeaders(init.headers, 'Content-Type', 'multipart/form-data')
	else if (params.bodyUrlEncoded)
		setHeaders(init.headers, 'Content-Type', 'application/x-www-form-urlencoded')
}

export function setHeaders(headers: HeadersInit, key: string, value: string) {
	if (Array.isArray(headers)) return headers.push([key, value])
	if (headers instanceof Headers) return headers.append(key, value)
	headers[key] = value
}
