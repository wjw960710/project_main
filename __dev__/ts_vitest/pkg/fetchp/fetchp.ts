import { transformUrl } from '@pkg/fetchp/utils/transform-url.ts'
import { setHeadersContentType } from '@pkg/fetchp/utils/set-headers.ts'
import { FetchpParams } from '@pkg/fetchp/fetchp.type.ts'

export async function fetchp(pUrl: string, params = {} as FetchpParams) {
	const init: RequestInit = {}

	const { method, url } = transformUrl(pUrl, params.params)
	init.method = method
	setHeadersContentType(init, params)

	const res = await fetch(url, init)

	return customResponse(res)
}

async function customResponse(res: Response) {
	if (res.ok && res.status >= 200 && res.status < 300) {
		const data = await res.json()
		if (data.code === '200') return data.data
	}

	return false
}
