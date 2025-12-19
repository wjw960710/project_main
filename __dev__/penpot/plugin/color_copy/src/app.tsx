import {useEffect, useState} from "react"

export function App() {
  const [libColors, setLibColors] = useState<LocalGroupColor[]>([])

  function getLocalColorList () {
    snedMessageToPenpot({ type: 'GET_LIB_COLORS' })
  }

  useEffect(() => {
    window.addEventListener('message', (event: MessageEvent<UiMessage<MessageType>>) => {
      onMessage(event, 'GET_LIB_COLORS', _event => {
        setLibColors(_event.data.data)
      })
    })
  }, [])

  return <div className="min-h-screen min-w-full bg-white flex items-center content-center justify-center flex-wrap">
    <div className={'text-black text-center text-[12rem]'}>
      {
        libColors.length
          ? libColors.map(e => {
            return <div key={e._key}>
              {e.data.map(f => {
                return <div key={f.name}>{e._key} {f.name}</div>
              })}
            </div>
          })
          : <div className={'cursor-pointer'} onClick={getLocalColorList}>取得顏色</div>
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