import {useEffect, useState} from "react"

export function App() {
  const [count, setCount] = useState(0)
  const [msgCount, setMsgCount] = useState(count)

  function updateCount () {
    const newCount = count + 1
    setCount(newCount)
    snedMessageToPenpot({type: 'COUNT', data: newCount})
  }

  useEffect(() => {
    window.addEventListener('message', (event: MessageEvent<UiMessage<MessageType>>) => {
      onMessage(event, 'COUNT', _event => {
        setMsgCount(_event.data.data)
      })
    })
  }, [])

  return <div className="min-h-screen min-w-full bg-white flex items-center content-center justify-center flex-wrap">
    <div className="text-[36rem] font-bold">Welcome plugin with Bun, React-TS and Tailwindcss!</div>
    <div className={'text-black text-center text-[32rem]'}>
      <div className={'cursor-pointer'} onClick={updateCount}>From UI: {count}</div>
      <div className={'cursor-pointer'} onClick={updateCount}>From Penpot: {msgCount}</div>
    </div>
  </div>
}

function snedMessageToPenpot <T extends MessageType>(msg: PenpotMessage<T>) {
  parent.postMessage(msg, '*')
}

function onMessage <T extends MessageType>(event: MessageEvent<UiMessage<T>>, type: T, callback: (event: MessageEvent<UiMessage<T>>) => void) {
  if (event.data.type === type) {
    callback(event)
  }
}