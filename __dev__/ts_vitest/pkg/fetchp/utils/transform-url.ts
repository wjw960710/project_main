type CacheUrl = {
	method: string
	urls: (string | undefined)[]
	dynamicParams?: Map<number, string>
}
const cacheUrls = new Map<string, CacheUrl>()
// url 格式為 {METHOD}:{URL (動態為 :dynamic_name)}
// eg: get:/api/user/:id
export function transformUrl(
	url: string,
	params?: Record<string, string>,
): { method: string; url: string; cache: true } {
	let cacheUrl = cacheUrls.get(url) as CacheUrl
	let isCache = !!cacheUrl

	if (!cacheUrl) {
		const _cacheUrl = {
			urls: [] as (string | undefined)[],
		} as CacheUrl

		let prev = ''
		for (let i = 0; i < url.length; i++) {
			if (url[i] === '{') {
				if (prev) {
					_cacheUrl.urls.push(prev)
					prev = ''
				}

				for (let j = i + 1; j < url.length; j++) {
					if (url[j] === '}') {
						if (_cacheUrl.urls.length) {
							_cacheUrl.urls.push(undefined)
							if (!_cacheUrl.dynamicParams) _cacheUrl.dynamicParams = new Map()
							_cacheUrl.dynamicParams.set(_cacheUrl.urls.length - 1, prev)
						} else {
							_cacheUrl.method = prev
						}

						prev = ''
						i = j
						break
					}

					prev += url[j]
				}

				continue
			}

			prev += url[i]
		}

		if (!_cacheUrl.urls.length && _cacheUrl.method) _cacheUrl.urls.push(prev)
		cacheUrls.set(url, (cacheUrl = _cacheUrl))
	}

	let result = ''
	for (let i = 0; i < cacheUrl.urls.length; i++) {
		const e = cacheUrl.urls[i]

		if (!e) {
			if (params && cacheUrl.dynamicParams) {
				const paramName = cacheUrl.dynamicParams.get(i)
				if (paramName) result += params[paramName]
				else result += undefined
			} else {
				result += undefined
			}

			continue
		}

		result += cacheUrl.urls[i]
	}

	return {
		method: cacheUrl.method || 'get',
		url: result,
		cache: isCache,
	}
}
