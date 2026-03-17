import { render, screen, fireEvent } from '@testing-library/react'
import { ReactContextTmplView } from '@/__tmpl__/react/context/app'
import { describe, it, expect } from 'vitest'
import React from 'react'

describe('ReactContextTmplView', () => {
	it('應該能正確渲染初始狀態並進行加減操作', () => {
		render(<ReactContextTmplView />)

		// 檢查初始狀態
		const countDisplay = screen.getByText('0')
		const addButton = screen.getByText('+')
		const subButton = screen.getByText('-')

		expect(countDisplay).toBeDefined()
		expect(addButton).toBeDefined()
		expect(subButton).toBeDefined()

		// 測試加法
		fireEvent.click(addButton)
		expect(screen.getByText('1')).toBeDefined()

		// 測試減法
		fireEvent.click(subButton)
		expect(screen.getByText('0')).toBeDefined()

		fireEvent.click(subButton)
		expect(screen.getByText('-1')).toBeDefined()
	})
})
