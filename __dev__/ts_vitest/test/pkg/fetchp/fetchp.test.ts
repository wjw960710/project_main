import { vi } from 'vitest'
import type { FetchpParams } from '@pkg/fetchp/fetchp.type.ts'
import { transformUrl } from '@pkg/fetchp/utils/transform-url.ts'
import { setHeaders, setHeadersContentType } from '@pkg/fetchp/utils/set-headers.ts'

describe('pkg fetchp', () => {
	beforeEach(() => {
		// Mock 全域 fetch 預設為 ok: true
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				return {
					ok: true,
					status: 200,
					json: async () => ({ code: '200', data: { version: '1.0.0' } }),
					headers: new Headers(),
				}
			}),
		)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('隨便測測', async () => {
		const res = await fetchp('{get}http://aaa.bbb')
		expect(res.version).toBe('1.0.0')
	})

	it('驗證 setHeaders 相關函數是否正確', () => {
		const reqInit1: ResponseInit = {}
		setHeadersContentType(reqInit1, { bodyJson: { hello: 'world' } })
		expect(reqInit1.headers).toBeDefined()
		expect((reqInit1.headers as Headers).get('Content-Type')).toBe('application/json')

		const reqInit2: ResponseInit = {}
		setHeadersContentType(reqInit2, { bodyFormData: new FormData() })
		expect(reqInit2.headers).toBeDefined()
		expect((reqInit2.headers as Headers).get('Content-Type')).toBe('multipart/form-data')

		const reqInit3: ResponseInit = {}
		setHeadersContentType(reqInit3, { bodyUrlEncoded: new URLSearchParams() })
		expect(reqInit3.headers).toBeDefined()
		expect((reqInit3.headers as Headers).get('Content-Type')).toBe(
			'application/x-www-form-urlencoded',
		)

		const reqInit4: ResponseInit = {
			headers: [],
		}
		setHeadersContentType(reqInit4, { bodyJson: { hello: 'world' } })
		expect((reqInit4.headers as [string, string][])[0][0]).toBe('Content-Type')
		expect((reqInit4.headers as [string, string][])[0][1]).toBe('application/json')

		const headers1 = new Headers()
		setHeaders(headers1, 'hello', 'world')
		expect(headers1.get('hello')).toBe('world')

		const headers2: [string, string][] = []
		setHeaders(headers2, 'hello', 'world')
		setHeaders(headers2, 'hello', 'world')
		expect(headers2.length).toBe(2)
		expect(headers2[0][1]).toBe('world')

		const headers3: Record<string, string> = {}
		setHeaders(headers3, 'hello', 'world')
		expect(headers3['hello']).toBe('world')
	})

	it('驗證 URL 轉換是否正確', () => {
		expect(transformUrl('{get/api/user')).toEqual({
			method: 'get',
			url: '',
			cache: false,
		})

		expect(transformUrl('{get/api/user')).toEqual({
			method: 'get',
			url: '',
			cache: true,
		})

		expect(transformUrl('{get/api/user', { 'get/api/user': '123' })).toEqual({
			method: 'get',
			url: '',
			cache: true,
		})

		expect(transformUrl('{get}/api/user')).toEqual({
			method: 'get',
			url: '/api/user',
			cache: false,
		})

		expect(transformUrl('{get}/api/user/{id}')).toEqual({
			method: 'get',
			url: '/api/user/undefined',
			cache: false,
		})

		expect(transformUrl('{get}/api/user/{id}', { id: '123' })).toEqual({
			method: 'get',
			url: '/api/user/123',
			cache: true,
		})

		expect(
			transformUrl('{get}/api/user/{id}/job/{name}', { id: '123', name: 'frank' }),
		).toEqual({
			method: 'get',
			url: '/api/user/123/job/frank',
			cache: false,
		})

		expect(
			transformUrl('{get}/api/user/{id}/job/{name}', { hello: '123', name: 'frank' }),
		).toEqual({
			method: 'get',
			url: '/api/user/undefined/job/frank',
			cache: true,
		})
	})
})

async function fetchp(pUrl: string, params = {} as FetchpParams) {
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
