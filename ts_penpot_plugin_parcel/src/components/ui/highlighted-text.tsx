type HighlightedTextProps = {
	text: string
	highlights: string[]
}

export function HighlightedText({ text, highlights }: HighlightedTextProps) {
	// 過濾掉空字串並轉義正則特殊字元
	const validHighlights = highlights
		.filter(h => h.trim() !== '')
		.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

	if (validHighlights.length === 0) {
		return <span>{text}</span>
	}

	// 將多個關鍵字用 | 組合，例如 (keyword1|keyword2)
	const regex = new RegExp(`(${validHighlights.join('|')})`, 'gi')
	const parts = text.split(regex)

	return (
		<span>
			{parts.map((part, i) =>
				// 檢查該部分是否與任何一個關鍵字匹配
				regex.test(part) ? (
					<mark key={i} className="rounded-sm bg-yellow-300 text-black">
						{part}
					</mark>
				) : (
					<span key={i}>{part}</span>
				),
			)}
		</span>
	)
}
