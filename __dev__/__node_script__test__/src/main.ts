import cp from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { NodeSSH, type Config } from 'node-ssh'
import yaml from 'js-yaml'
import { bootstrapCac } from '../build-recipe/cac'
import { assign, merge, omit } from 'radash'

type Env = Partial<{
	ssh_host: string
	ssh_username: string
	ssh_password: string
	ssh_static: string // ssh 上的靜態資源主目錄(也就是 app.ssh_name 的父目錄)
	app: Record<string, EnvApp>
}>

type EnvApp = Partial<{
	ssh_name: string // SSH 上的專案名，拼接在 static 後的
	project_dir: string // 專案目錄絕對路徑
	upload_file: string // 專案目錄下的上傳檔案相對路徑
	build_exec: string // 專案下運行的打包指令
}>

type ResultEnv = Omit<Env, 'app'> & {
	app: EnvApp
}

const defaultCliOptions = {
	'--config <string>': {
		desc: 'config 檔路徑',
		defaultValue: '',
	},
	'--env <string>': {
		desc: '執行環境',
		defaultValue: '',
	},
	'--app <string>': {
		desc: '應用名稱',
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

// 主函數
async function main() {
	if (!options.config || !options.env || !options.app) {
		throw new Error('缺少必要的配置檔參數 --config, --env, --app')
	}

	const yamlTxt = fs.readFileSync(options.config, 'utf8')
	const allEnv = yaml.load(yamlTxt) as Record<string, Env> | string
	let env: ResultEnv
	if (typeof allEnv === 'string') {
		throw new Error(`${options.env} 配置檔內容格式錯誤`)
	}
	if (!allEnv[options.env]) {
		throw new Error(`環境 ${options.env} 配置不存在`)
	}
	const baseEnv = allEnv.base || {}
	const allAppEnv: Record<string, EnvApp> = assign(
		baseEnv.app || {},
		allEnv[options.env].app || {},
	)
	let appEnv: EnvApp
	if (!allAppEnv[options.app]) {
		throw new Error(`${options.app} app 配置不存在`)
	}
	appEnv = allAppEnv[options.app]
	env = {
		...assign(omit(allEnv.base || {}, ['app']), omit(allEnv[options.env] || {}, ['app'])),
		app: appEnv,
	}

	console.log('env:', env)

	if (!env.ssh_host || !env.ssh_username || !env.ssh_password) {
		throw new Error('缺少必要的 SSH 連線參數 ssh_host, ssh_username, ssh_password')
	}

	if (
		!env.ssh_static ||
		!env.app.ssh_name ||
		!env.app.project_dir ||
		!env.app.upload_file ||
		!env.app.build_exec
	) {
		throw new Error('缺少打包/上傳必要的參數 ssh_static, app.project_dir, app.build_exec')
	}

	// SSH 連線設定 - 請替換為你的實際值
	const sshConfig: Config = {
		host: env.ssh_host,
		username: env.ssh_username,
		password: env.ssh_password,
		port: 22,
	}

	console.log('開始運行打包指令 ...')
	await runCommand(env.app.build_exec, env.app.project_dir)
	console.log('✅ 已完成運行打包指令')

	let conn: NodeSSH | null = null
	try {
		// 建立連線
		conn = await connect(sshConfig)
		const homePath = await resolveRemotePath(conn, '~')

		const [, remoteBundleZipFilepath] = await uploadFile(
			conn,
			path.join(env.app.project_dir, env.app.upload_file),
			homePath,
		)
		console.log('✅ 檔案上傳成功!')

		const remoteAppDir = path.posix.join(env.ssh_static, env.app.ssh_name)

		console.log(`開始將檔案解壓縮至 ${remoteAppDir}`)
		await conn.execCommand(`sudo unzip -o ${remoteBundleZipFilepath} -d ${remoteAppDir}`)
		console.log('✅ 檔案解壓縮成功!')

		// 刪除原始 ZIP 檔案
		await deleteRemoteFile(conn, remoteBundleZipFilepath)

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

// 建立 SSH 連線
async function connect(config: Config) {
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

/**
 * 刪除遠端檔案
 * @param conn - SSH 連線
 * @param remotePath - 遠端檔案路徑
 */
async function deleteRemoteFile(conn: NodeSSH, remotePath: string): Promise<void> {
	try {
		const resolvedRemotePath = await resolveRemotePath(conn, remotePath)
		const result = await conn.execCommand(`rm -f "${resolvedRemotePath}"`)

		if (result.code === 0) {
			console.log(`🗑️ 檔案刪除成功: ${resolvedRemotePath}`)
		} else {
			console.error(`❌ 檔案刪除失敗: ${result.stderr}`)
			throw new Error(`Failed to delete file: ${result.stderr}`)
		}
	} catch (error) {
		console.error('刪除檔案時出錯:', error)
		throw error
	}
}

/**
 * 在指定目录执行命令的简化版本
 * @param command - 命令字符串
 * @param cwd - 工作目录
 */
export async function runCommand(command: string, cwd: string) {
	return new Promise((resolve, reject) => {
		console.log(`📂 目录: ${cwd}`)
		console.log(`🚀 命令: ${command}`)

		const childProcess = cp.exec(command, {
			cwd,
			maxBuffer: 1024 * 1024 * 10, // 10MB buffer
		})

		let stdout = ''
		let stderr = ''

		// 監聽標準輸出
		childProcess.stdout?.on('data', data => {
			const output = data.toString()
			process.stdout.write(output)
			stdout += output
		})

		// 監聽錯誤輸出
		childProcess.stderr?.on('data', data => {
			const output = data.toString()
			process.stderr.write(output)
			stderr += output
		})

		// 監聽執行完成
		childProcess.on('close', code => {
			if (code === 0) {
				console.log('✅ 执行成功')
				resolve({ success: true, output: stdout, error: stderr })
			} else {
				console.error(`❌ 执行失败，退出码: ${code}`)
				reject(new Error(`Command failed with exit code ${code}`))
			}
		})

		// 監聽錯誤
		childProcess.on('error', error => {
			console.error('❌ 执行失败:', error.message)
			reject(error)
		})
	})
}
