import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { html as beautifyHtml } from 'js-beautify'
import * as cheerio from 'cheerio'
import { select, input } from '@inquirer/prompts'
import TurndownService from 'turndown'

const BASE_URL = 'http://192.168.168.199:3000'
const STRUCTURE_API = `${BASE_URL}/api/structure`
const DIST_DIR = path.join(__dirname, '../dist')

// 配置是否拉取 CSS 和 JS
const FETCH_CSS = true
const FETCH_JS = false

interface Spec {
	id: string
	title: string
}

interface Module {
	id: string
	name: string
	specs: Spec[]
}

interface Project {
	name: string
	modules: Module[]
}

async function getSelectedSpec(): Promise<Spec> {
	const response = await axios.get(STRUCTURE_API)
	const projects: Project[] = response.data
	const dpProject = projects.find(p => p.name === 'DP')

	if (!dpProject) {
		throw new Error('Could not find project DP')
	}

	const moduleChoices = [
		...dpProject.modules.map(m => ({
			name: m.name,
			value: m.name,
		})),
		{ name: '自行輸入 SPEC_ID', value: 'CUSTOM_INPUT' },
	]

	const moduleName = await select({
		message: 'Select a module:',
		choices: moduleChoices,
	})

	if (moduleName === 'CUSTOM_INPUT') {
		const specId = await input({
			message: '請輸入 SPEC_ID (spec_XXX):',
			validate: value => value.trim() !== '' || 'SPEC_ID 不能為空',
		})

		// 在所有 module 中尋找匹配的 spec
		for (const m of dpProject.modules) {
			const spec = m.specs.find(s => s.id === specId)
			if (spec) {
				return spec
			}
		}

		throw new Error(`找不到 ID 為 ${specId} 的規格`)
	}

	const selectedModule = dpProject.modules.find(m => m.name === moduleName)!

	const selectedSpec = await select({
		message: 'Select a spec:',
		choices: selectedModule.specs.map(s => ({
			name: `${s.title} ${s.id}`,
			value: s,
		})),
	})

	return selectedSpec
}

async function downloadFile(url: string, localPath: string) {
	try {
		const dir = path.dirname(localPath)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}

		const response = await axios({
			url,
			method: 'GET',
			responseType: 'stream',
		})

		return new Promise((resolve, reject) => {
			const writer = fs.createWriteStream(localPath)
			response.data.pipe(writer)
			writer.on('finish', resolve)
			writer.on('error', reject)
		})
	} catch (error: any) {
		console.error(`Failed to download from ${url}: ${error.message}`)
	}
}

async function main() {
	try {
		const selectedSpec = await getSelectedSpec()
		const API_URL = `${BASE_URL}/api/specs/${selectedSpec.id}`

		console.log(`Fetching from ${API_URL}...`)
		const response = await axios.get(API_URL)
		const { title, content } = response.data

		const SPEC_DIST_DIR = path.join(DIST_DIR, title)

		// 額外獲取根目錄的 HTML 以便獲取全域 CSS/JS
		console.log(`Fetching root page from ${BASE_URL} to get global assets...`)
		const rootResponse = await axios.get(BASE_URL)
		const $root = cheerio.load(rootResponse.data)

		// 在開始前僅重建該 spec 的目錄
		if (fs.existsSync(SPEC_DIST_DIR)) {
			console.log(`Recreating directory ${SPEC_DIST_DIR}...`)
			fs.rmSync(SPEC_DIST_DIR, { recursive: true, force: true })
		}
		if (!fs.existsSync(DIST_DIR)) {
			fs.mkdirSync(DIST_DIR, { recursive: true })
		}
		fs.mkdirSync(SPEC_DIST_DIR, { recursive: true })

		// 解析 HTML 並提取圖片
		console.log('Parsing HTML and downloading images...')
		const $ = cheerio.load(content)
		const imgs = $('img')
		const downloadPromises: Promise<any>[] = []

		imgs.each((index, element) => {
			const src = $(element).attr('src')
			if (src && src.startsWith('/uploads/')) {
				const imageUrl = `${BASE_URL}${src}`
				const relativePath = src.startsWith('/') ? src.slice(1) : src
				const localPath = path.join(SPEC_DIST_DIR, relativePath)

				console.log(`Queuing download: ${imageUrl} -> ${localPath}`)
				downloadPromises.push(downloadFile(imageUrl, localPath))

				// 標準化路徑，確保為相對路徑且無 / 開頭
				const normalizedPath = relativePath.replace(/\\/g, '/')
				$(element).attr('src', normalizedPath)
			}
		})

		// 處理 CSS 和 JS
		console.log(`Handling assets (CSS: ${FETCH_CSS}, JS: ${FETCH_JS})...`)
		const assetTags: { tag: string; attr: string }[] = []
		if (FETCH_CSS) assetTags.push({ tag: 'link[rel="stylesheet"]', attr: 'href' })
		if (FETCH_JS) assetTags.push({ tag: 'script[src]', attr: 'src' })

		const headTags: string[] = []
		const bodyTags: string[] = []

		for (const { tag, attr } of assetTags) {
			$root(tag).each((index, element) => {
				const originalUrl = $(element).attr(attr)
				if (originalUrl) {
					let downloadUrl = originalUrl
					let relativePath = originalUrl

					if (originalUrl.startsWith('http')) {
						// CDN 資源
						const urlObj = new URL(originalUrl)
						relativePath = path.join('lib', urlObj.hostname, urlObj.pathname)
						downloadUrl = originalUrl
					} else {
						// 本地資源
						downloadUrl = originalUrl.startsWith('/')
							? `${BASE_URL}${originalUrl}`
							: `${BASE_URL}/${originalUrl}`
						relativePath = originalUrl.startsWith('/') ? originalUrl.slice(1) : originalUrl
					}

					const localPath = path.join(SPEC_DIST_DIR, relativePath)
					console.log(`Queuing asset download: ${downloadUrl} -> ${localPath}`)
					downloadPromises.push(downloadFile(downloadUrl, localPath))

					// 標準化路徑
					const normalizedPath = relativePath.replace(/\\/g, '/')
					if (tag.includes('link')) {
						headTags.push(`<link rel="stylesheet" href="${normalizedPath}">`)
					} else {
						bodyTags.push(`<script src="${normalizedPath}"></script>`)
					}
				}
			})
		}

		if (downloadPromises.length > 0) {
			console.log(`Downloading ${downloadPromises.length} files...`)
			await Promise.all(downloadPromises)
			console.log('All files downloaded successfully.')
		} else {
			console.log('No files found to download.')
		}

		// 將 CSS 注入到 head，將 JS 注入到 body 前
		let finalHtml = $.html()
		const headContent = headTags.join('\n')
		const bodyContent = bodyTags.join('\n')
		finalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  ${headContent}
  <style>
    body { font-family: sans-serif; padding: 20px; }
  </style>
</head>
<body class="edit-mode">
  <div class="app-wrapper">
    <main class="sys-content">
      <div id="workspace" class="main-container">
        ${finalHtml}
      </div>
    </main>
  </div>
  ${bodyContent}
</body>
</html>`

		// 格式化 HTML
		console.log('Formatting HTML content...')
		const formattedHtml = beautifyHtml(finalHtml, {
			indent_size: 2,
			indent_char: ' ',
			max_preserve_newlines: 1,
			preserve_newlines: true,
			keep_array_indentation: false,
			break_chained_methods: false,
			indent_scripts: 'normal',
			brace_style: 'collapse',
			space_before_conditional: true,
			unescape_strings: false,
			jslint_happy: false,
			end_with_newline: true,
			wrap_line_length: 0,
			indent_inner_html: true,
			comma_first: false,
			e4x: false,
			indent_empty_lines: false,
		})

		const fileName = 'index.html'
		const filePath = path.join(SPEC_DIST_DIR, fileName)

		fs.writeFileSync(filePath, formattedHtml)
		console.log(`Successfully saved updated HTML to ${filePath}`)

		// 也保留 JSON 檔案以供參考
		const jsonPath = path.join(SPEC_DIST_DIR, `${selectedSpec.id}.json`)
		fs.writeFileSync(jsonPath, JSON.stringify(response.data, null, 2))
		console.log(`Successfully saved raw JSON to ${jsonPath}`)

		// 生成 Markdown
		console.log('Generating Markdown content...')
		const turndownService = new TurndownService({
			headingStyle: 'atx',
			codeBlockStyle: 'fenced',
		})

		// 移除多餘的互動資訊，如 "To open the popup, press Shift+Enter"
		turndownService.addRule('removeInteractiveNoise', {
			filter: node => {
				const text = node.textContent?.trim()
				return (
					text === 'To open the popup, press Shift+Enter' ||
					text === 'Paragraph' ||
					text === '▼'
				)
			},
			replacement: () => '',
		})

		const markdown = turndownService.turndown($.html())
		const mdPath = path.join(SPEC_DIST_DIR, 'index.md')
		fs.writeFileSync(mdPath, markdown)
		console.log(`Successfully saved Markdown to ${mdPath}`)
	} catch (error: any) {
		console.error('Error fetching or processing the file:', error.message)
		process.exit(1)
	}
}

main()
