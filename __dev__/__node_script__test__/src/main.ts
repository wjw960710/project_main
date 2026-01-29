import path from 'node:path'
import SSH2Promise from 'ssh2-promise'
import { pick } from 'radash'
import { bootstrapCac } from '../build-recipe/cac'
import SFTP from 'ssh2-promise/lib/sftp'

interface SSHConfig {
	host: string // 替換為你的 IP
	port: number // SSH 端口，通常是 22
	username: string // 替換為你的用戶名
	password: string // 替換為你的密碼
}
const defaultCliOptions = {
	'--host <string>': {
		desc: '連線 IP',
		defaultValue: '',
	},
	'--port <number>': {
		desc: '端口',
		defaultValue: 22,
	},
	'--username <string>': {
		desc: '用戶名',
		defaultValue: '',
	},
	'--password <string>': {
		desc: '密碼',
		defaultValue: '',
	},
	'--app <string>': {
		desc: '應用名稱',
		defaultValue: 'player',
	},
	'--mode <string>': {
		desc: 'vite mode',
		defaultValue: 'production',
	},
} satisfies Record<string, any>

const { options } = bootstrapCac({
	options: defaultCliOptions,
})

console.log('子指令參數：')
console.log(JSON.stringify(options, null, 2))

const appInfo = {
	player: {
		remoteRoot: '/player-client',
		projectRoot: 'D:\\player-client',
	},
}

// 執行主函數
main().catch(console.error)

// 建立 SSH 連線
async function connectSSH(config: SSHConfig): Promise<SSH2Promise> {
	const conn = new SSH2Promise(config)
	await conn.connect()
	console.log('✅ SSH 連線成功!')
	return conn
}

async function resolveRemotePath(ssh: SSH2Promise, remotePath: string) {
	if (remotePath.startsWith('~')) {
		const homePath = (await ssh.exec('echo $HOME')).trim()
		return homePath + remotePath.substring(1)
	}

	return remotePath
}

async function uploadFile(sftp: SFTP, localPath: string, remotePath: string) {
	const [, filename] = localPath.match(/[/\\]([^/\\]+)$/) || [undefined, 'unknown']
	const fullRemotePath = remotePath.endsWith('/')
		? `${remotePath}${filename}`
		: `${remotePath}/${filename}`
	await sftp.fastPut(localPath, fullRemotePath)
	return [filename, fullRemotePath]
}

async function verifyRemoteFileExists(sftp: SFTP, remotePath: string): Promise<boolean> {
	try {
		await sftp.stat(remotePath)
		return true
	} catch (error) {
		return false
	}
}

// 主函數
async function main() {
	// SSH 連線設定 - 請替換為你的實際值
	const sshConfig: SSHConfig = pick(options, ['host', 'port', 'username', 'password'])

	if (!sshConfig.host || !sshConfig.port || !sshConfig.username || !sshConfig.password) {
		throw new Error('缺少必要的 SSH 連線參數 --host, --port, --username, --password')
	}

	let ssh: SSH2Promise | null = null
	let sftp: SFTP | null = null

	try {
		// 建立 SSH 連線
		ssh = await connectSSH(sshConfig)
		sftp = ssh.sftp()

		// const homePath = await resolveRemotePath(ssh, '~')
		const [, remoteFilepath] = await uploadFile(
			sftp,
			'D:\\player-client\\dist\\dist.zip',
			'/player-client',
		)
		console.log('✅ 檔案上傳成功!')

		// 驗證上傳的檔案是否存在
		const exists = await verifyRemoteFileExists(sftp, remoteFilepath)
		if (exists) {
			await ssh.exec('sudo unzip -o /player-client/dist.zip -d /player-client/')
			console.log('✅ 檔案解壓縮成功!')
		}
	} catch (error) {
		console.error('❌ 執行過程中發生錯誤:', error)
	} finally {
		if (ssh) {
			await ssh.close()
			console.log('✅ SSH 已關閉連線!')
		}
	}
}
