import {useEffect, useState} from "react"

function snedMessageToPenpot <T extends PenpotMessageType>(msg: PenpotMessage<T>) {
  parent.postMessage(msg, '*')
}

export function App() {
  const [localColors, setLocalColors] = useState<LOCAL_GROUP_COLOR_List>([])

  function getLocalColorList () {
    snedMessageToPenpot({ type: 'GET_LOCAL_COLOR_LIST' })
  }

  useEffect(() => {
    window.addEventListener('message', (event: MessageEvent<UiMessage<any>>) => {
      switch (event.data.type) {
        case 'GET_LOCAL_COLOR_LIST': {
          setLocalColors(event.data.data)
          break
        }
        default:
      }
    })
  }, [])

  return <div className="min-h-screen min-w-full bg-white flex items-center content-center justify-center flex-wrap">
    <div className={'text-black text-center text-[12rem]'}>
      {
        localColors.length
          ? localColors.map(e => {
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