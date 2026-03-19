fetch('http://localhost:1234/jsonrpc', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	},
	body: JSON.stringify({
		method: 'HelloService.Hello',
		params: ['world'],
		id: 0
	})
})
	.then(res => res.text())
	.then(data => {
		console.log("响应：", data);
	})
	.catch(err => {
		console.error("请求失败：", err.message);
	});
