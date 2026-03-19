package main

import (
	"fmt"
	"net/rpc"
)

func main() {
	client, err := rpc.Dial("tcp", "localhost:1234")
	if err != nil {
		panic("連接失敗")
	}
	//var reply = new(string)
	var reply string
	err = client.Call("HelloService.Hello", "world", &reply)
	if err != nil {
		panic("調用失敗")
	}
	fmt.Println(reply)
}
