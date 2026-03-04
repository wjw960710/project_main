export function setupCatApp(container: HTMLElement) {
	container.innerHTML = `
    <div>
      <button id="fetch-btn">獲取貓圖片</button>
      <div id="cat-display"></div>
    </div>
  `

	const button = container.querySelector('#fetch-btn') as HTMLButtonElement
	const display = container.querySelector('#cat-display') as HTMLDivElement

	button.addEventListener('click', async () => {
		display.innerHTML = '載入中...'
		try {
			const response = await fetch('https://api.thecatapi.com/v1/images/search')
			const data = await response.json()
			if (data && data.length > 0) {
				display.innerHTML = `<img src="${data[0].url}" alt="貓圖片" style="max-width: 300px;" />`
			}
		} catch (error) {
			display.innerHTML = '獲取失敗'
		}
	})
}
