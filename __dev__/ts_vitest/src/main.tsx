import 'virtual:uno.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ReactContextTmplView } from '@/__tmpl__/react/context/app'

const rootElement = document.getElementById('root')
if (rootElement) {
	ReactDOM.createRoot(rootElement).render(
		<React.StrictMode>
			<ReactContextTmplView />
		</React.StrictMode>,
	)
}
