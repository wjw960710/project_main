package main

import (
	"net"
	"net/rpc"
	"net/rpc/jsonrpc"
)

type HelloService struct{}

func (h *HelloService) Hello(name string, reply *string) error {
	*reply = "Hello " + name
	return nil
}

func main() {
	listener, _ := net.Listen("tcp", ":1234")
	_ = rpc.RegisterName("HelloService", &HelloService{})
	for {
		conn, _ := listener.Accept()
		go rpc.ServeCodec(jsonrpc.NewServerCodec(conn))
	}
}
