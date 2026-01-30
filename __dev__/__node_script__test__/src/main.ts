import { NodeSSH } from 'node-ssh'
import { pick } from 'radash'
import { bootstrapCac } from '../build-recipe/cac'

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
	'--username <string>': {
		desc: '用戶名',
		defaultValue: '',
	},
	'--password <string>': {
		desc: '密碼',
		defaultValue: '',
	},
} satisfies Record<string, any>

const { options } = bootstrapCac({
	options: defaultCliOptions,
})

console.log('子指令參數：')
console.log(JSON.stringify(options, null, 2))

// 執行主函數
main().catch(console.error)

// 建立 SSH 連線
async function connect(config: SSHConfig) {
	const conn = new NodeSSH()
	await conn.connect(config)
	console.log('✅ SSH 連線成功!')
	return conn
}

async function resolveRemotePath(conn: NodeSSH, remotePath: string = '~'): Promise<string> {
	if (remotePath.startsWith('~')) {
		const result = await conn.execCommand('echo $HOME')
		const homeDir = result.stdout.trim()
		return homeDir + remotePath.substring(1)
	}
	return remotePath
}

async function uploadFile(
	conn: NodeSSH,
	localPath: string,
	remotePath: string,
): Promise<[string, string]> {
	const [, filename] = localPath.match(/[/\\]([^/\\]+)$/) || [undefined, 'unknown']

	// 解析遠端路徑
	const resolvedRemotePath = await resolveRemotePath(conn, remotePath)

	const fullRemotePath = resolvedRemotePath.endsWith('/')
		? `${resolvedRemotePath}${filename}`
		: `${resolvedRemotePath}/${filename}`

	// 執行文件上傳
	await conn.putFile(localPath, fullRemotePath)
	console.log(`📁 文件上傳成功: ${filename} -> ${fullRemotePath}`)

	return [filename, fullRemotePath]
}

async function checkFileExists(conn: NodeSSH, remotePath: string): Promise<boolean> {
	try {
		const resolvedRemotePath = await resolveRemotePath(conn, remotePath)
		const result = await conn.execCommand(
			`test -f "${resolvedRemotePath}" && echo "1" || echo "0"`,
		)
		return result.stdout.trim() === '1'
	} catch (error) {
		console.error('檢查文件存在時出錯:', error)
		return false
	}
}

// 主函數
async function main() {
	// SSH 連線設定 - 請替換為你的實際值
	const sshConfig: SSHConfig = Object.assign(pick(options, ['host', 'username', 'password']), {
		port: 22,
	})

	if (!sshConfig.host || !sshConfig.username || !sshConfig.password) {
		throw new Error('缺少必要的 SSH 連線參數 --host, --username, --password')
	}

	let conn: NodeSSH | null = null
	try {
		// 建立連線
		conn = await connect(sshConfig)

		// 示例使用
		const exists = await checkFileExists(conn, '~/test.txt')
		console.log('文件存在:', exists)

		// 記得在完成後關閉連線
		conn.dispose()
		console.log('🔒 SSH 連線已關閉')
	} catch (error) {
		console.error('❌ SSH 操作失敗:', error)
		if (conn) {
			conn.dispose()
		}
		throw error
	}
}
