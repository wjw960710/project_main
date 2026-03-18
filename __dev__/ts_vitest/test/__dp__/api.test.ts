import { config } from '@config/api.ts'

const { BASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD } = config

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

describe('DP API 測試', () => {
	let sid: string

	beforeAll(async () => {
		sid = await login()
	})

	it('驗證渠道列表', async () => {
		const res = await fetch(`${BASE_URL}/merchant-admin-api/adConfig/list`, {
			method: 'POST',
			headers: {
				Sid: sid,
				'Content-Type': 'application/json;charset=UTF-8',
			},
			body: JSON.stringify({
				adChannel: '',
				order: {},
				status: true,
				pageNumber: 1,
				pageSize: 20,
				createTimeStart: null,
				createTimeEnd: null,
			}),
		})

		expect(res.ok).toBe(true)
		expect(res.status).toBe(200)

		const data = await res.json()
		expect(data.code).toBe('200')

		expect(data).haveOwnProperty('data')
		expect(data.data).haveOwnProperty('model')
		expect(Array.isArray(data.data.model)).toBe(true)
	})
})

async function login() {
	const res = await fetch(`${BASE_URL}/merchant-admin-api/passport/login.html`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			username: ADMIN_USERNAME,
			password: ADMIN_PASSWORD,
			authentication: '',
			key: '',
			captcha: '',
		}),
	})

	expect(res.ok).toBe(true)
	expect(res.status).toBe(200)

	const sid = res.headers.get('Sid')
	expect(sid).toBeDefined()

	const data = await res.json()
	expect(data.code).toBe('200')

	return sid!
}
