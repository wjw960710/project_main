import { fetchp } from '@pkg/fetchp/fetchp'
import { transformUrl } from '@pkg/fetchp/utils/transform-url.ts'
import { vi } from 'vitest'

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

	it('驗證 URL 轉換是否正確', async () => {
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
