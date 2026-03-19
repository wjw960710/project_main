import net from "node:net";

const client = net.createConnection({ host: "127.0.0.1", port: 1234 }, () => {
	const req = {
		method: "HelloService.Hello",
		params: ["world"],
		id: 0,
	};

	client.write(JSON.stringify(req) + "\n");
});

client.on("data", (data) => {
	console.log("响应：", data.toString());
	client.end();
});

client.on("error", (err) => {
	console.error("连接失败：", err.message);
});
