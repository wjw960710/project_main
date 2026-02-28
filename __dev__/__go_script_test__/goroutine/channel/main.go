package main

import (
	"fmt"
	"time"
)

func main() {
	var msg chan string
	msg = make(chan string, 1) // 二參為0叫做無緩衝通道
	msg <- "hello channel"
	fmt.Println(<-msg)

	var msg2 chan string
	msg2 = make(chan string, 0) //無緩衝要用goroutine消費
	go func(msg chan string) {  // go有happen-before的機制
		fmt.Println(<-msg)
	}(msg2)
	msg2 <- "hello channel2"

	time.Sleep(time.Second)
}
