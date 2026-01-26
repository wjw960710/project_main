import type { LibraryColor } from '@penpot/plugin-types'

export function sortColorNameList(
	colorList: LibraryColor[],
	{ transformElement } = {} as {
		transformElement: (el: LibraryColor) => LibraryColor
	},
) {
	const regex = /^([A-z]+)(\d+)/

	return colorList.sort((a, b) => {
		const _a = (transformElement ? transformElement(a) : a).name || ''
		const _b = (transformElement ? transformElement(b) : b).name || ''
		const matchA = _a.match(regex)
		const matchB = _b.match(regex)

		if (!matchA || !matchB) {
			return _a.localeCompare(_b)
		}

		const [_, prefixA, numA] = matchA // 分為前綴與數字
		const [__, prefixB, numB] = matchB

		if (prefixA !== prefixB) {
			// 比較字母前綴
			return prefixA.localeCompare(prefixB)
		}

		// 比較數字部分
		return parseInt(numA, 10) - parseInt(numB, 10)
	})
}
