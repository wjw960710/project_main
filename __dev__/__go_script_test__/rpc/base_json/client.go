package main

import (
	"fmt"
	"net"
	"net/rpc"
	"net/rpc/jsonrpc"
)

func main() {
	conn, err := net.Dial("tcp", "localhost:1234")
	if err != nil {
		panic("連接失敗")
	}
	//var reply = new(string)
	var reply string
	client := rpc.NewClientWithCodec(jsonrpc.NewClientCodec(conn))
	err = client.Call("HelloService.Hello", "world", &reply)
	if err != nil {
		panic("調用失敗")
	}
	fmt.Println(reply)
}
