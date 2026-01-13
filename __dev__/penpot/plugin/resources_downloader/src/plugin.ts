penpot.ui.open('Resources Downloader', '', {
	width: 375,
	height: 500,
})

penpot.ui.onMessage(async (message: PenpotMessage<MessageType>) => {
	if (message.type === 'DEMO') {
		const a = penpot.library.connected.filter(e => e.components.length > 0)

		if (a.length > 0) {
			const b = a[0].components[0]

			const res = await b.mainInstance().export({
				type: 'png',
			})

			penpot.ui.sendMessage({
				type: message.type,
				data: res,
			})
		}
	}
})