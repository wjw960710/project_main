import ReactDOM from 'react-dom/client'
import { App } from './app.tsx'
import qs from "query-string";
import {theme} from "./store/context.ts";
import type {Theme} from "@penpot/plugin-types";

const { pp_theme } = qs.parse(window.location.search) as { pp_theme?: Theme }
if (pp_theme === 'dark') {
  theme(pp_theme)
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
