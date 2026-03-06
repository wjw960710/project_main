console.log('Background worker loaded')

chrome.runtime.onInstalled.addListener(() => {
	console.log('Extension installed')
})
