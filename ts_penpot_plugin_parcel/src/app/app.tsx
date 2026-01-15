import { App as CopyColorApp } from '@/app/app-copy-color.tsx'
import { App as ResourcesDownloaderApp } from '@/app/app-resources-downloader.tsx'

export function App () {
  return <div>
		<CopyColorApp />
		<ResourcesDownloaderApp />
	</div>
}