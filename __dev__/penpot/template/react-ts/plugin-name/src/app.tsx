import {useEffect, useState} from "react"

function snedMessageToPenpot <T extends PenpotMessageType>(msg: PenpotMessage<T>) {
  parent.postMessage(msg, '*')
}

export function App() {
  const [count, setCount] = useState(0)
  const [msgCount, setMsgCount] = useState(count)

  function updateCount () {
    const newCount = count + 1
    setCount(newCount)
    snedMessageToPenpot({type: 'count', data: newCount})
  }

  useEffect(() => {
    window.addEventListener('message', (event: MessageEvent<UiMessage<UiMessageType>>) => {
      switch (event.data.type) {
        case 'count': {
          setMsgCount(event.data.data)
          break
        }
        default:
      }
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