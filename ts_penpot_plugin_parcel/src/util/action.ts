import { toast } from 'sonner'

export function copyToClipboard (multilineText: string, name?: string) {
	let _name = ''
	if (name?.trim()) {
		_name += `：${name}`
	}

	const textArea = document.createElement('textarea')
	textArea.value = multilineText
	document.body.appendChild(textArea)
	textArea.select()
	try {
		document.execCommand('copy')
		toast.success(`複製成功${_name}`)
	} catch (error) {
		console.error(error)
		toast.error(`複製異常${_name}`)
	}
	document.body.removeChild(textArea)
}