import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// 1. 獲取命令行參數中的 entry
const args = process.argv.slice(2)
const entryIndex = args.indexOf('--entry')
let ENTRY_PATH = ''

if (entryIndex !== -1 && args[entryIndex + 1]) {
	ENTRY_PATH = args[entryIndex + 1]
} else {
	// 降級方案：從檔名提取（保持部分相容性）
	const srcDir = path.join(process.cwd(), 'src')
	const files = fs.readdirSync(srcDir)
	const entryFile = files.find(f => f.startsWith('index.v') && f.endsWith('.ts'))
	if (entryFile) {
		ENTRY_PATH = path.join('src', entryFile)
	}
}

if (!ENTRY_PATH || !fs.existsSync(path.join(process.cwd(), ENTRY_PATH))) {
	console.error(`[Compile] Could not find entry file: ${ENTRY_PATH || 'Not specified'}`)
	process.exit(1)
}

// 2. 從 ENTRY_PATH 提取版本號 (例如 index.v2.ts -> v2)
const entryFile = path.basename(ENTRY_PATH)
const versionMatch = entryFile.match(/\.(v\d+)\./i)
const version = versionMatch ? versionMatch[1] : 'unknown'
const TEMP_EXE = 'dist/run.exe'
const FINAL_NAME = `新原型拉取腳本_${version}.exe`
const FINAL_PATH = path.join(process.cwd(), 'dist', FINAL_NAME)

console.log(`[Compile] Starting compilation for version ${version} from ${entryFile}...`)

// 3. 執行 Bun 編譯
const buildResult = spawnSync(
	'bun',
	[
		'build',
		ENTRY_PATH,
		'--compile',
		'--minify',
		'--define',
		`process.env.APP_ENV='production'`,
		'--outfile',
		TEMP_EXE,
	],
	{ stdio: 'inherit', shell: true },
)

if (buildResult.status !== 0) {
	console.error('[Compile] Bun build failed.')
	process.exit(1)
}

// 4. 刪除已存在的舊版執行檔 (強制覆蓋)
if (fs.existsSync(FINAL_PATH)) {
	console.log(`[Compile] Removing existing file: ${FINAL_NAME}`)
	fs.unlinkSync(FINAL_PATH)
}

// 5. 更名
if (fs.existsSync(TEMP_EXE)) {
	console.log(`[Compile] Renaming ${TEMP_EXE} to ${FINAL_NAME}`)
	fs.renameSync(TEMP_EXE, FINAL_PATH)
	console.log(`[Compile] Success! Output: ${FINAL_PATH}`)
} else {
	console.error(`[Compile] Error: ${TEMP_EXE} not found after build.`)
	process.exit(1)
}
