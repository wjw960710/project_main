/**
 * 這個腳本運行在 MAIN world 中，可以直接訪問和修改頁面的全域變量與 Storage。
 */

function injectUserData() {
	console.log('[Extension] Injecting spec_user_data into localStorage')
	try {
		const userData = JSON.stringify({
			username: '假人',
			role: 'editor',
		})
		localStorage.setItem('spec_user_data', userData)
		console.log('[Extension] Successfully injected spec_user_data')
	} catch (e) {
		console.error('[Extension] Failed to inject spec_user_data:', e)
	}
}

// 立即執行注入邏輯
injectUserData()
