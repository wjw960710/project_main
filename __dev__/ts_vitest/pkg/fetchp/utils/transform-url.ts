import {
	FetchpTransformUrlCacheItem,
	FetchpTransformUrlCaches,
	FetchpTransformUrlOptions,
	FetchpTransformUrlResult,
} from '@pkg/fetchp/fetchp.type.ts'

let caches: FetchpTransformUrlCaches | undefined

// 格式參考 {get}/api/user/{id}
//         {post}/api/user/detail
export function transformUrl({
	url,
	pathParams,
	caches: pCaches,
}: FetchpTransformUrlOptions): FetchpTransformUrlResult {
	const _cacheUrls = pCaches || caches || (caches = new Map())
	let cacheUrl = _cacheUrls.get(url) as FetchpTransformUrlCacheItem

	if (!cacheUrl) {
		const _cacheUrl = {
			urls: [] as (string | undefined)[],
		} as FetchpTransformUrlCacheItem

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
		if (!_cacheUrl.dynamicParams) _cacheUrl.url = _cacheUrl.urls.join('')
		_cacheUrls.set(url, (cacheUrl = _cacheUrl))
	}

	let result = ''
	if (cacheUrl.url != null) {
		result = cacheUrl.url
	} else {
		for (let i = 0; i < cacheUrl.urls.length; i++) {
			const e = cacheUrl.urls[i]

			if (!e) {
				if (pathParams && cacheUrl.dynamicParams) {
					const paramName = cacheUrl.dynamicParams.get(i)
					if (paramName) result += pathParams[paramName]
					else result += undefined
				} else {
					result += undefined
				}

				continue
			}

			result += cacheUrl.urls[i]
		}
	}

	return {
		method: cacheUrl.method || 'get',
		url: result,
	}
}
