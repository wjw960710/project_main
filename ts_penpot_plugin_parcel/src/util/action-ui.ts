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

export function snedMessage<T extends MessageType>(
	type: T,
	...args: PenpotMessage<T> extends { type: any; data: infer D }
		? D extends undefined
			? []
			: [D]
		: []
) {
	parent.postMessage(
		{
			type,
			data: (args as any[])[0],
		},
		'*',
	)
}