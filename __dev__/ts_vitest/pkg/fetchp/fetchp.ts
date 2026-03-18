export function createFetchp() {
	return (input: RequestInfo | URL, init?: RequestInit) => {
		return fetch(input, init)
	}
}
