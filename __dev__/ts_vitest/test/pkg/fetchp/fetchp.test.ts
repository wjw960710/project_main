import { vi } from 'vitest'
import {
	FetchpCacheResponses,
	type FetchpCacheUrls,
	FetchpMergeCacheCalls,
	FetchpParams,
} from '@pkg/fetchp/fetchp.type.ts'
import { transformUrl } from '@pkg/fetchp/utils/transform-url.ts'
import { setHeaders, setHeadersContentType } from '@pkg/fetchp/utils/set-headers.ts'
import { mergeCall, mergeId } from '@pkg/fetchp/utils/merge-call.ts'
import { cacheCall } from '@pkg/fetchp/utils/cache-call.ts'

describe('pkg fetchp', () => {
	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				await sleep(250)
				return createBaseMockReturn()
			}),
		)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('全整合測試', async () => {
		async function fetchp(pUrl: string, params = {} as FetchpParams) {
			const init: RequestInit = {}
			const { method, url } = transformUrl(pUrl, params.pathParams)
			init.method = method

			const id = mergeId(method, url, params.params)
			const apiCall = async () => {
				setHeadersContentType(init, params)
				const res = await fetch(url, init)
				return customResponse(res)
			}

			return cacheCall(
				id,
				() => mergeCall(id, apiCall),
				res => res !== false,
			)
		}
	})

	it('測試緩存響應', async () => {
		let fetchCount = 0

		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				fetchCount++
				await sleep(250)
				return createBaseMockReturn()
			}),
		)

		async function fetchp(input: string, params: Record<string, string | number> = {}) {
			const id = mergeId(input, params)
			const apiCall = async () => {
				const res = await fetch(input)
				return customResponse(res)
			}

			return cacheCall(id, apiCall, res => res !== false, cacheResponses)
		}

		const cacheResponses: FetchpCacheResponses = new Map()
		const res = await fetchp('{get}http://aaa.bbb')
		const res2 = await fetchp('{get}http://aaa.bbb')
		expect(res.version).toBe('1.0.0')
		expect(fetchCount).toBe(1)
		expect(cacheResponses.size).toBe(1)
	})

	it('測試連環調用是否會等待第一個響應結果', async () => {
		let fetchCount = 0

		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				fetchCount++
				await sleep(Math.random() * 250 + 100)
				return createBaseMockReturn()
			}),
		)

		const cacheCalls: FetchpMergeCacheCalls = new Map()
		async function fetchp(input: string, params: Record<string, string | number> = {}) {
			const id = mergeId(input, params)
			const apiCall = async () => {
				const res = await fetch(input)
				return customResponse(res)
			}

			return mergeCall(id, apiCall, cacheCalls)
		}

		const res1 = await Promise.all(
			Array(5)
				.fill(0)
				.map(() => fetchp('{get}http://aaa.bbb')),
		)

		expect(fetchCount).toBe(1)
		expect(res1).toEqual(Array(5).fill({ version: '1.0.0' }))
		expect(cacheCalls.get('gethttp://aaa.bbb')).toBeUndefined()

		fetchp('{get}http://aaa.bbb')
		await fetchp('{get}http://aaa.bbb')
		expect(fetchCount).toBe(2)
		await fetchp('{get}http://aaa.bbb')
		expect(cacheCalls.size).toBe(0)
		expect(fetchCount).toBe(3)

		await fetchp('{get}http://aaa.bbb', { id: 1, name: 'frank' })
		await fetchp('{get}http://aaa.bbb', { id: 1, name: 'frank' })
		expect(cacheCalls.size).toBe(0)
		expect(fetchCount).toBe(5)

		await Promise.all([
			fetchp('{get}http://aaa.bbb', { id: 1, name: 'frank' }),
			fetchp('{get}http://aaa.bbb', { id: 1, name: 'frank' }),
			fetchp('{get}http://aaa.bbb', { id: 1, name: 'jeff' }),
			fetchp('{get}http://aaa.bbb'),
		])
		expect(cacheCalls.size).toBe(0)
		expect(fetchCount).toBe(8)
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
		const cacheUrls: FetchpCacheUrls = new Map()

		expect(cacheUrls.get('{get/api/user')).toBeUndefined()
		expect(transformUrl('{get/api/user', undefined, cacheUrls)).toEqual({
			method: 'get',
			url: '',
		})
		expect(cacheUrls.get('{get/api/user')).toBeDefined()

		expect(transformUrl('{get/api/user', undefined, cacheUrls)).toEqual({
			method: 'get',
			url: '',
		})

		expect(transformUrl('{get/api/user', { 'get/api/user': '123' }, cacheUrls)).toEqual({
			method: 'get',
			url: '',
		})

		expect(transformUrl('{get}/api/user', undefined, cacheUrls)).toEqual({
			method: 'get',
			url: '/api/user',
		})

		expect(transformUrl('{get}/api/user/{id}', undefined, cacheUrls)).toEqual({
			method: 'get',
			url: '/api/user/undefined',
		})

		expect(cacheUrls.get('{get}/api/user/{id}')).toBeDefined()
		expect(transformUrl('{post}/api/user/{id}', { id: '123' }, cacheUrls)).toEqual({
			method: 'post',
			url: '/api/user/123',
		})
		expect(cacheUrls.get('{post}/api/user/{id}')).toBeDefined()

		expect(
			transformUrl('{get}/api/user/{id}/job/{name}', { id: '123', name: 'frank' }, cacheUrls),
		).toEqual({
			method: 'get',
			url: '/api/user/123/job/frank',
		})

		expect(
			transformUrl(
				'{get}/api/user/{id}/job/{name}',
				{ hello: '123', name: 'frank' },
				cacheUrls,
			),
		).toEqual({
			method: 'get',
			url: '/api/user/undefined/job/frank',
		})

		expect(cacheUrls.size).toBe(5)
	})

	function createBaseMockReturn() {
		return {
			ok: true,
			status: 200,
			json: async () => {
				return { code: '200', data: { version: '1.0.0' } }
			},
			headers: new Headers(),
		}
	}

	async function customResponse(res: Response) {
		if (res.ok && res.status >= 200 && res.status < 300) {
			const data = await res.json()
			if (data.code === '200') return data.data
		}

		return false
	}

	function sleep(timeout: number) {
		return new Promise(resolve => setTimeout(resolve, timeout))
	}
})
