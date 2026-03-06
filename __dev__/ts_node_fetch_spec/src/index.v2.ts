import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { html as beautifyHtml } from 'js-beautify'
import * as cheerio from 'cheerio'
import { select, input } from '@inquirer/prompts'
import TurndownService from 'turndown'

const BASE_URL = 'http://192.168.168.199:3000'
const STRUCTURE_API = `${BASE_URL}/api/structure`
// 根據執行環境決定輸出目錄 (Bun 編譯後的 exe 執行時會使用 "原型")
const isCompiled = process.env.APP_ENV === 'production'
const DIST_DIR = path.join(process.cwd(), isCompiled ? '原型' : 'dist')

// 配置是否拉取 CSS 和 JS
const FETCH_CSS = true
const FETCH_JS = false

// 提取自 app.js 的互動邏輯與樣式
const EXPORT_UI_CSS = `
  body { padding: 40px; font-family: "Microsoft JhengHei", sans-serif; background: #f4f6f8; margin: 0; }
  .main-container { max-width: 100%; margin: 0 auto; background: transparent; }
  .sys-sidebar, .sys-header { display: none; }
  .collapsed .revision-body, .collapsed .intro-body, .collapsed .wireflow-body, .collapsed .scenario-body { display: none; }
  .target-img { cursor: pointer; margin: inherit; }

  /* 強制隱藏所有未被 JS 清除乾淨的佔位符 */
  [contenteditable]:empty::before,
  .scenario-title:empty::before,
  .scenario-desc:empty::before,
  .scenario-logic:empty::before,
  .cell-content:empty::before {
      content: none !important;
      display: none !important;
  }

  /* 區塊白底樣式 *//*
  .section-box, .spec-block, .step-card, .scenario-card, .intro-section, .revision-section, .wireflow-container, .impact-unified-card, .impact-box {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 20px;
  }*/
  .revision-body, .intro-body, .wireflow-body { background: #fff; }

  /* 表格微調 */
  .spec-table th, .spec-table td { border: 1px solid #ddd; }
  .scenario-table th, .scenario-table td { border: 1px solid #ddd; }

  /* 隱藏空表格列 */
  tr:empty { display: none; }

  /* 燈箱 CSS */
  .lightbox-left { position: relative; }
  .lightbox-scroll-wrapper { overflow-y: auto; height: 100%; display: flex; justify-content: center; align-items: flex-start; }
  .lb-nav-btn { position: absolute; top: 50%; transform: translateY(-50%); z-index: 100; cursor: pointer; background: rgba(0,0,0,0.3); color: #fff; border: none; font-size: 24px; padding: 10px; }
  .lb-nav-btn.prev { left: 10px; }
  .lb-nav-btn.next { right: 10px; }
`

const EXPORT_UI_JS = `
  let currentLightboxGroup = [];
  let currentLightboxIndex = -1;
  function toggleRevision() { document.querySelector('.revision-section').classList.toggle('collapsed'); }
  function toggleIntro() { document.querySelector('.intro-section').classList.toggle('collapsed'); }
  function toggleUserScenario() { document.getElementById('user-scenario-section').classList.toggle('collapsed'); }
  function toggleWireflow() { document.getElementById('wireflow-section').classList.toggle('collapsed'); }

  function showLightbox(el) {
      if (el.src && el.src.includes("placehold.co")) return;
      const lb = document.getElementById('lightbox');
      const contentBox = lb.querySelector('.lightbox-content');
      const img = document.getElementById('lightbox-img');
      const textContainer = document.getElementById('lightbox-text-container');
      const titleEl = lb.querySelector('.lightbox-spec-title');
      img.src = el.src;
      lb.style.display='flex';
      currentLightboxGroup = [];
      currentLightboxIndex = -1;
      if (el.closest("#flow-container")) {
          currentLightboxGroup = Array.from(document.querySelectorAll("#flow-container .step-card .target-img"));
      } else if (el.closest(".scenario-card")) {
          currentLightboxGroup = Array.from(document.querySelectorAll(".scenario-card .target-img"));
      } else {
          currentLightboxGroup = [el];
      }
      currentLightboxIndex = currentLightboxGroup.indexOf(el);
      updateLightboxNav();
      textContainer.innerHTML = "";
      contentBox.classList.remove("lightbox-vertical", "lightbox-only-img");
      if(titleEl) titleEl.innerText = "規格說明";
      const stepCard = el.closest(".step-card");
      if (stepCard) {
           const stepTitle = stepCard.querySelector(".step-header span")?.innerText;
           const stepNum = stepCard.querySelector(".step-num")?.innerText;
           if(titleEl) titleEl.innerText = stepTitle ? \`Step \${stepNum}: \${stepTitle}\` : "規格說明";
           const specContent = stepCard.querySelector(".spec-content");
           if (specContent) {
               const clone = specContent.cloneNode(true);
               clone.querySelectorAll(".img-container, img, button, input").forEach(i => i.remove());
               textContainer.appendChild(clone);
           }
      } else {
           if(!stepCard) {
               contentBox.classList.add("lightbox-only-img");
               if(titleEl) titleEl.style.display = 'none';
           }
      }
  }
  function switchLightboxImage(offset) {
      const newIndex = currentLightboxIndex + offset;
      if (newIndex < 0 || newIndex >= currentLightboxGroup.length) return;
      const targetImg = currentLightboxGroup[newIndex];
      if (targetImg) showLightbox(targetImg);
  }
  function updateLightboxNav() {
      const prevBtn = document.getElementById("lb-prev");
      const nextBtn = document.getElementById("lb-next");
      if (!prevBtn || !nextBtn) return;
      if (currentLightboxGroup.length <= 1) {
          prevBtn.style.display = "none";
          nextBtn.style.display = "none";
          return;
      }
      prevBtn.style.display = currentLightboxIndex > 0 ? "flex" : "none";
      nextBtn.style.display = currentLightboxIndex < currentLightboxGroup.length - 1 ? "flex" : "none";
  }
  function closeLightbox(e) {
      if (e && e.target !== document.getElementById("lightbox") && !e.target.classList.contains("lightbox-close-btn")) return;
      document.getElementById('lightbox').style.display='none';
  }

  // 自動為所有圖片綁定點擊事件
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.target-img').forEach(img => {
      img.addEventListener('click', () => showLightbox(img));
    });
  });
`

const LIGHTBOX_HTML = `
  <div id="lightbox" class="lightbox-overlay" onclick="closeLightbox(event)">
    <div class="lightbox-content" onclick="event.stopPropagation()">
      <button class="lightbox-close-btn" onclick="closeLightbox()">✕</button>
      <div class="lightbox-left">
        <button id="lb-prev" class="lb-nav-btn prev" onclick="switchLightboxImage(-1)">❮</button>
        <button id="lb-next" class="lb-nav-btn next" onclick="switchLightboxImage(1)">❯</button>
        <div class="lightbox-scroll-wrapper">
            <img id="lightbox-img" src="" alt="Preview" />
        </div>
      </div>
      <div class="lightbox-right">
        <div class="lightbox-spec-title">規格說明</div>
        <div id="lightbox-text-container" class="lightbox-text-body"></div>
      </div>
    </div>
  </div>
`

interface Spec {
	id: string
	title: string
	last_ver: string
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

async function getSelectedSpec(): Promise<{ spec: Spec; moduleName: string }> {
	console.log(`Connecting to ${STRUCTURE_API}...`)
	const response = await axios.get(STRUCTURE_API)
	console.log('Structure fetched successfully.')
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

	console.log(`Select module: ${moduleChoices.length} choices available.`)
	const moduleNameChoice = await select({
		message: 'Select a module:',
		choices: moduleChoices,
	})
	console.log(`Module selected: ${moduleNameChoice}`)

	if (moduleNameChoice === 'CUSTOM_INPUT') {
		const specId = await input({
			message: '請輸入 SPEC_ID (spec_XXX):',
			validate: value => value.trim() !== '' || 'SPEC_ID 不能為空',
		})

		// 在所有 module 中尋找匹配的 spec
		for (const m of dpProject.modules) {
			const spec = m.specs.find(s => s.id === specId)
			if (spec) {
				return { spec, moduleName: m.name }
			}
		}

		throw new Error(`找不到 ID 為 ${specId} 的規格`)
	}

	const selectedModule = dpProject.modules.find(m => m.name === moduleNameChoice)!

	const selectedSpec = await select({
		message: 'Select a spec:',
		choices: selectedModule.specs
			.filter(e => !!e.last_ver)
			.map(s => ({
				name: `${s.title} ${s.id}`,
				value: s,
			})),
	})

	return { spec: selectedSpec, moduleName: selectedModule.name }
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
		console.log('Script starting...')
		const { spec: selectedSpec, moduleName } = await getSelectedSpec()
		console.log('Spec selected:', selectedSpec.title)
		const API_URL = `${BASE_URL}/api/specs/${selectedSpec.id}`

		console.log(`Fetching from ${API_URL}...`)
		const response = await axios.get(API_URL)
		const { title, content } = response.data

		const MODULE_DIST_DIR = path.join(DIST_DIR, moduleName)
		const SPEC_DIST_DIR = path.join(MODULE_DIST_DIR, title)

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
		if (!fs.existsSync(MODULE_DIST_DIR)) {
			fs.mkdirSync(MODULE_DIST_DIR, { recursive: true })
		}
		fs.mkdirSync(SPEC_DIST_DIR, { recursive: true })

		// 解析 HTML 並提取圖片
		console.log('Parsing HTML and downloading images...')
		const $ = cheerio.load(content)

		// 移除編輯相關元素 (同步 app.js 的淨化邏輯)
		const selectorToRemove = [
			'.title-row',
			'.btn-add-row',
			'.del-btn',
			'.row-handle',
			'.col-drag',
			'.col-action',
			'.add-spec-controls',
			'.img-control-bar',
			'.tox',
			'.btn-share-public',
			'.upload-btn',
			'.remove-btn',
			'.add-step-card',
			'.step-delete-btn',
			'.drag-hint',
			'.scenario-footer',
			'.wireflow-notes',
			'.btn-edit-rev',
		]
		$(selectorToRemove.join(',')).remove()

		// 處理使用者情境表格的頭尾欄位
		$('.scenario-table th:first-child, .scenario-table td:first-child').remove()
		$('.scenario-table th:last-child, .scenario-table td:last-child').remove()

		// 處理 Checkbox：沒勾選的移除，有勾選的鎖定
		$('input[type="checkbox"]').each((_, el) => {
			const $chk = $(el)
			const $parent = $chk.closest('.chk-item')
			if (!$chk.prop('checked')) {
				$parent.remove()
			} else {
				$chk.attr('disabled', 'true')
				$chk.removeAttr('id')
				$parent.find('label').removeAttr('for')
			}
		})

		// 移除編輯屬性
		$('[contenteditable]').removeAttr('contenteditable')
		$('input, textarea, select').attr('disabled', 'true')

		// 確保圖片有 target-img class 以便觸發燈箱
		$('img').addClass('target-img')

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
		let finalHtml = $('body').html() || $.html()
		const headContent = headTags.join('\n')
		const bodyContent = bodyTags.join('\n')
		finalHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${headContent}
  <style>
    ${EXPORT_UI_CSS}
  </style>
</head>
<body class="view-mode" style="padding: 0">
  <div class="app-wrapper">
    <main class="sys-content">
      <div id="workspace" class="main-container">
    		<div class="title-row">
					<h1 style="color: var(--primary)">${title}</h1>
				</div>
        ${finalHtml}
      </div>
    </main>
  </div>

  ${LIGHTBOX_HTML}

  ${bodyContent}
  <script>
    ${EXPORT_UI_JS}
  </script>
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
		if (error.stack) {
			console.error(error.stack)
		}
		console.log('\n按下 Enter 鍵以退出...')
		await new Promise(resolve => {
			process.stdin.resume()
			process.stdin.once('data', resolve)
		})
		process.exit(1)
	}
}

main()
