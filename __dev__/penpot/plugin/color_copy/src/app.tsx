import {useEffect, useState} from "react"

export function App() {
  const [libColors, setLibColors] = useState<LocalGroupColor[]>([])

  useEffect(() => {
    window.addEventListener('message', (event: MessageEvent<UiMessage<MessageType>>) => {
      onMessage(event, 'GET_LIB_COLORS', _event => {
        setLibColors(_event.data.data)
      })
    })
  }, [])

  function handleGetLibColors () {
    snedMessageToPenpot({ type: 'GET_LIB_COLORS' })
  }

  function handleTest () {
    snedMessageToPenpot({ type: 'TEST' })
  }

  return <div className="min-h-screen min-w-full bg-white flex items-center content-center justify-center flex-wrap">
    <div className={'text-black text-center text-[12rem]'}>
      <div className={'cursor-pointer border-solid border-2 border-black p-[8rem]'} onClick={handleTest}>test</div>
      {
        libColors.length
          ? libColors.map(e => {
            return <div key={e._key}>
              {e.data.map(f => {
                return <div key={f.name}>{e._key} {f.name}</div>
              })}
            </div>
          })
          : <div className={'cursor-pointer'} onClick={handleGetLibColors}>取得顏色</div>
      }
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