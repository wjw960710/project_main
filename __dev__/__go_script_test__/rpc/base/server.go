package main

import (
	"net"
	"net/rpc"
)

type HelloService struct{}

func (h *HelloService) Hello(name string, reply *string) error {
	*reply = "Hello " + name
	return nil
}

func main() {
	//	1. 實例化server
	listener, _ := net.Listen("tcp", ":1234")
	//	2. 註冊處理邏輯 handler
	_ = rpc.RegisterName("HelloService", &HelloService{})
	//	3. 啟動服務
	conn, _ := listener.Accept()
	rpc.ServeConn(conn)
}
