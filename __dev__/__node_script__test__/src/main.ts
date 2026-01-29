import { Client } from 'ssh2'
import path from 'node:path'

interface SSHConfig {
	host: string
	port: number
	username: string
	password: string
}

// 建立 SSH 連線
async function connectSSH(config: SSHConfig): Promise<Client> {
	const conn = new Client()

	return new Promise((resolve, reject) => {
		conn
			.on('ready', () => {
				console.log('✅ SSH 連線成功!')
				resolve(conn)
			})
			.on('error', err => {
				console.error('❌ SSH 連線失敗:', err.message)
				reject(err)
			})
			.connect({
				host: config.host,
				port: config.port,
				username: config.username,
				password: config.password,
			})
	})
}

// 執行指令並回傳結果
async function executeCommand(conn: Client, command: string): Promise<string> {
	return new Promise((resolve, reject) => {
		conn.exec(command, (err, stream) => {
			if (err) {
				reject(err)
				return
			}

			let output = ''
			let errorOutput = ''

			stream
				.on('close', (code: number) => {
					if (code === 0) {
						resolve(output)
					} else {
						reject(new Error(`指令執行失敗，退出代碼: ${code}\nError: ${errorOutput}`))
					}
				})
				.on('data', (data: Buffer) => {
					output += data.toString()
				})
				.stderr.on('data', (data: Buffer) => {
					errorOutput += data.toString()
				})
		})
	})
}

// 關閉 SSH 連線
function disconnectSSH(conn: Client): void {
	conn.end()
	console.log('🔌 SSH 連線已關閉')
}

async function resolveRemotePath(conn: Client, remotePath: string) {
	if (remotePath.startsWith('~')) {
		const homePath = (await executeCommand(conn, 'echo $HOME')).trim()
		return homePath + remotePath.substring(1)
	}

	return remotePath
}

// 上傳檔案到遠端服務器
async function uploadFile(
	conn: Client,
	localPath: string,
	remotePath: string = '~',
): Promise<void> {
	const remotePathResolved = await resolveRemotePath(conn, remotePath)

	return new Promise((resolve, reject) => {
		conn.sftp((err, sftp) => {
			if (err) {
				reject(new Error(`無法建立 SFTP 連線: ${err.message}`))
				return
			}

			const [, fileName] = localPath.match(/[/\\]([^/\\]+)$/) || [undefined, 'unknown']
			const fullRemotePath = remotePathResolved.endsWith('/')
				? `${remotePathResolved}${fileName}`
				: `${remotePathResolved}/${fileName}`

			console.log(`📤 開始上傳檔案: ${localPath} -> ${fullRemotePath}`)

			sftp.fastPut(localPath, fullRemotePath, err => {
				if (err) {
					reject(new Error(`上傳檔案失敗: ${err.message}`))
					return
				}

				console.log(`✅ 檔案上傳成功: ${fullRemotePath}`)
				resolve()
			})
		})
	})
}

// 批量上傳多個檔案
async function uploadMultipleFiles(
	conn: Client,
	filePaths: string[],
	remotePath: string = '~',
): Promise<void> {
	const remotePathResolved = await resolveRemotePath(conn, remotePath)

	console.log(`📦 開始批量上傳 ${filePaths.length} 個檔案到 ${remotePathResolved}`)
	for (const filePath of filePaths) {
		try {
			await uploadFile(conn, filePath, remotePathResolved)
		} catch (error) {
			console.error(`❌ 上傳檔案 ${filePath} 失敗:`, error)
			throw error
		}
	}

	console.log('✅ 所有檔案上傳完成!')
}

// 檢查遠端檔案是否存在
async function checkRemoteFileExists(conn: Client, remotePath: string): Promise<boolean> {
	const remotePathResolved = await resolveRemotePath(conn, remotePath)

	try {
		await executeCommand(conn, `test -f "${remotePathResolved}" && echo "exists"`)
		return true
	} catch (error) {
		console.error(error)
		return false
	}
}

// 列出遠端目錄檔案（使用 SFTP）
async function listRemoteFiles(conn: Client, remotePath: string = '~'): Promise<void> {
	const remotePathResolved = await resolveRemotePath(conn, remotePath)

	return new Promise((resolve, reject) => {
		conn.sftp((err, sftp) => {
			if (err) {
				reject(new Error(`無法建立 SFTP 連線: ${err.message}`))
				return
			}

			sftp.readdir(remotePathResolved, (err, list) => {
				if (err) {
					reject(new Error(`無法讀取目錄 ${remotePathResolved}: ${err.message}`))
					return
				}

				console.log(`📁 目錄 "${remotePathResolved}" 的內容:`)
				console.log('----------------------------------------')
				list.forEach(item => {
					const type = item.attrs.isDirectory() ? '📁' : '📄'
					const size = item.attrs.isDirectory() ? '' : ` (${item.attrs.size} bytes)`
					console.log(`${type} ${item.filename}${size}`)
				})

				resolve()
			})
		})
	})
}

// 主函數
async function main() {
	// SSH 連線設定 - 請替換為你的實際值
	const sshConfig: SSHConfig = {
		host: 'HOST', // 替換為你的 IP
		port: 22, // SSH 端口，通常是 22
		username: 'USERNAME', // 替換為你的用戶名
		password: 'PASSWORD', // 替換為你的密碼
	}

	let connection: Client | null = null

	try {
		// 建立 SSH 連線
		connection = await connectSSH(sshConfig)

		// 列出家目錄的檔案
		await listRemoteFiles(connection)

		// 上傳單一檔案範例（請替換為實際的本地檔案路徑）
		// await uploadFile(connection, 'D:\\file.txt');

		// 批量上傳檔案範例
		// const filesToUpload = [
		//   './file1.txt',
		//   './file2.json',
		//   './file3.js'
		// ];
		// await uploadMultipleFiles(connection, filesToUpload, '~');

		// 檢查檔案是否存在
		// const fileExists = await checkRemoteFileExists(connection, '~/uploaded-file.txt');
		// console.log(`檔案存在: ${fileExists}`);
	} catch (error) {
		console.error('❌ 執行過程中發生錯誤:', error)
	} finally {
		if (connection) {
			disconnectSSH(connection)
		}
	}
}

// 執行主函數
main().catch(console.error)
