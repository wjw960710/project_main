import { useTmplTestContext } from '@/__tmpl__/react/context/context'
import { TmplTestProvider } from '@/__tmpl__/react/context/provider'

function ReactContextTmplViewContent() {
	const { count, add, sub } = useTmplTestContext()

	return (
		<div className={'w-full h-screen flex justify-center items-center gap-4'}>
			<button
				className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
				onClick={sub}
			>
				-
			</button>
			<div className="text-2xl font-bold font-mono min-w-[3rem] text-center">{count}</div>
			<button
				className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
				onClick={add}
			>
				+
			</button>
		</div>
	)
}

export function ReactContextTmplView() {
	return (
		<TmplTestProvider>
			<ReactContextTmplViewContent />
		</TmplTestProvider>
	)
}
