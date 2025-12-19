penpot.ui.open("Plugin name", "", {
  width: 375,
  height: 500,
})

penpot.ui.onMessage((message: PenpotMessage<MessageType>) => {
  onMessage(message, 'COUNT', _message => {
    penpot.ui.sendMessage({
      type: _message.type,
      data: _message.data * 10,
    })
  })
})

function onMessage <T extends MessageType>(message: PenpotMessage<T>, type: T, callback: (message: PenpotMessage<T>) => void) {
  if (message.type === type) {
    callback(message)
  }
}