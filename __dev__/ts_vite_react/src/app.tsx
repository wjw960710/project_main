import {Counter} from "./component/counter/counter.tsx";
import {Counter2} from "./component/counter2/counter.tsx";
import {Todo} from "./component/todo/todo.tsx";
import {Todo2} from "./component/todo2/todo.tsx";

function App() {

  return (
    <div>
      <Counter />
      <Counter2 />
      <hr/>
      <Todo />
      <Todo2 />
    </div>
  )
}

export default App
