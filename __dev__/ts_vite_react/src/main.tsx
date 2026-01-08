import '@unocss/reset/eric-meyer.css'
import 'virtual:uno.css'
import { createRoot } from 'react-dom/client'
import App from './app.tsx'

createRoot(document.getElementById('root')!).render(
    <App />
)
