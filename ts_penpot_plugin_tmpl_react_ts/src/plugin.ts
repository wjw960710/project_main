import { name as manifestName } from '../public/manifest.json'
import { version as pkgVersion } from '../package.json'

console.log(penpot) // 為了能線上測試用

penpot.ui.open(`${manifestName} v${pkgVersion}`, `?pp_theme=${penpot.theme}`, {
	width: 375,
	height: 500,
})

penpot.ui.onMessage((message: PenpotMessage<MessageType>) => {
	const msg = message
	if (msg.type === 'COUNT') {
		sendMessage(msg.type, msg.data * 10)
	}
})

function sendMessage<T extends MessageType>(
	type: T,
	...args: UiMessage<T> extends { type: any; data: infer D }
		? D extends undefined
			? []
			: [D]
		: []
) {
	penpot.ui.sendMessage({
		type,
		data: (args as any[])[0],
	})
}
