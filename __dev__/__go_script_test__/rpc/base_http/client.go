package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type rpcRequest struct {
	Method string `json:"method"`
	Params []any  `json:"params"`
	ID     int    `json:"id"`
}

type rpcResponse struct {
	ID     int             `json:"id"`
	Result json.RawMessage `json:"result"`
	Error  any             `json:"error"`
}

func main() {
	reqBody := rpcRequest{
		Method: "HelloService.Hello",
		Params: []any{"world"},
		ID:     1,
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		panic("请求序列化失败")
	}

	resp, err := http.Post(
		"http://localhost:1234/jsonrpc",
		"application/json",
		bytes.NewReader(data),
	)
	if err != nil {
		panic("连接失败")
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		panic("读取响应失败")
	}

	var rpcResp rpcResponse
	if err := json.Unmarshal(body, &rpcResp); err != nil {
		panic("解析响应失败")
	}

	var reply string
	if err := json.Unmarshal(rpcResp.Result, &reply); err != nil {
		panic("解析结果失败")
	}

	fmt.Println(reply)
}
