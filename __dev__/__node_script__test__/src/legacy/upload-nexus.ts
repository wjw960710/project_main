import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import fetch from 'node-fetch'

uploadToNexus(fs.readFileSync(path.join(process.cwd(), 'src/asset/test.txt')), 'test.txt', {
	nexusUrl: '',
	repository: '',
	username: '',
	password: '',
})

/**
 * 上傳 raw data 到 Nexus
 * @param data - 要上傳的資料（Buffer, Blob, string 等）
 * @param filename - 檔案名稱
 * @param options - Nexus 配置選項
 */

async function uploadToNexus(
	data: Buffer | Blob | string,
	filename: string,
	options: {
		nexusUrl: string
		repository: string
		username: string
		password: string
	},
) {
	const { nexusUrl, repository, username, password } = options
	const url = `${nexusUrl}/service/rest/v1/components?repository=${repository}`

	const credentials = Buffer.from(`${username}:${password}`).toString('base64')

	// 添加調試信息
	console.log('URL:', url)
	console.log('Repository:', repository)
	console.log('Username:', username)
	console.log('Credentials (base64):', credentials)

	const formData = new FormData()
	formData.append('raw.directory', '/penpot/plugin/parcel/')
	formData.append('raw.asset1', new Blob([data]), filename)
	formData.append('raw.asset1.filename', filename)

	try {
		const agent = new https.Agent({
			rejectUnauthorized: false,
		})
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${credentials}`,
			},
			body: formData,
			agent,
		})

		console.log('Status:', response.status)
		console.log('Status Text:', response.statusText)

		// 讀取錯誤響應內容
		const responseText = await response.text()
		console.log('Response:', responseText)

		if (!response.ok) {
			throw new Error(`上傳失敗: ${response.status} ${response.statusText}\n${responseText}`)
		}

		console.log(`✅ 成功上傳 ${filename} 到 Nexus`)
		return response
	} catch (error) {
		console.error('錯誤詳情:', error)
	}
}
