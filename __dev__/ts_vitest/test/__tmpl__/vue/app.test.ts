import { render, fireEvent } from '@testing-library/vue'
import { describe, it, expect } from 'vitest'
import App from '@/__tmpl__/vue/app.vue'

describe('Vue App Component', () => {
	it('應該能正確渲染初始狀態並進行加減操作', async () => {
		const { getByText } = render(App)

		// 檢查初始狀態
		const countDisplay = getByText('0')
		const addButton = getByText('+')
		const subButton = getByText('-')

		expect(countDisplay).toBeDefined()
		expect(addButton).toBeDefined()
		expect(subButton).toBeDefined()

		// 測試加法
		await fireEvent.click(addButton)
		expect(getByText('1')).toBeDefined()

		// 測試減法
		await fireEvent.click(subButton)
		expect(getByText('0')).toBeDefined()

		await fireEvent.click(subButton)
		expect(getByText('-1')).toBeDefined()
	})
})
