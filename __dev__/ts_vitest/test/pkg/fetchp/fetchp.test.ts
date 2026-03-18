import { createFetchp } from '@pkg/fetchp/fetchp'
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
					json: async () => ({ version: '1.0.0' }),
					headers: new Headers(),
				}
			}),
		)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('隨便測測', async () => {
		const fetchp = createFetchp()
		const res = await fetchp('http://aaa.bbb')
		expect(res.ok).toBe(true)
		expect(res.status).toBe(200)

		const data = await res.json()
		expect(data.version).toBe('1.0.0')
	})
})
