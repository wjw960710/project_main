import {Counter} from "./component/counter/counter.tsx";
import {Counter2} from "./component/counter2/counter.tsx";
import {Todo} from "./component/todo/todo.tsx";
import {Todo2} from "./component/todo2/todo.tsx";
import {Todo3} from "./component/todo3/todo.tsx";
import {Todo4} from "./component/todo4/todo.tsx";
import {Todo5} from "./component/todo5/todo.tsx";

function App() {

  return (
    <div className={'flex flex-col items-center justify-center'}>
      <div className={'my-4'}>原生ctx 計數器</div>
      <Counter />
      <div className={'my-4'}>createProvider 計數器</div>
      <Counter2 />

      <div className={'w-full h-1 bg-gray my-8'}/>

      <div className={'my-4'}>原生ctx 待辦事項</div>
      <Todo />
      <div className={'my-4'}>createProvider 待辦事項</div>
      <Todo2 />
      <div className={'my-4'}>原生ctx但provider value實現放在createContext檔案裡 待辦事項</div>
      <Todo3 />
      <div className={'my-4'}>原生ctx但在同檔裡封裝Provider/use 待辦事項</div>
      <Todo4 />
      <div className={'my-4'}>原生ctx但provder寫在context裡 待辦事項</div>
      <Todo5 />
    </div>
  )
}

export default App
