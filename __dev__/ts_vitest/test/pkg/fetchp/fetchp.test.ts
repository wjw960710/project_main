import { createFetchp } from '@pkg/fetchp/fetchp'

describe('pkg fetchp', () => {
	it('測試是否能請求', async () => {
		const fetchp = createFetchp()
		const res = await fetchp(`https://api.thecatapi.com/v1`)
		expect(res.ok).toBe(true)
		expect(res.status).toBe(200)

		const data = await res.json()
		expect(data).haveOwnProperty('version')
	})
})
