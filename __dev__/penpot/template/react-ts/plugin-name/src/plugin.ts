penpot.ui.open("Plugin name", "", {
  width: 375,
  height: 500,
})

penpot.ui.onMessage((message: PenpotMessage<PenpotMessageType>) => {
  switch (message.type) {
    case 'count': {
      const msg: UiMessage<'count'> = {
        type: 'count',
        data: message.data * 10,
      }
      penpot.ui.sendMessage(msg)
      break
    }
    default:
  }
})