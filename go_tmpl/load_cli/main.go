package main

import (
	"flag"
	"fmt"
	"runtime/debug"
)

func main() {
	defer func() {
		if err := recover(); err != nil {
			fmt.Println(string(debug.Stack()))
		}
	}()

	var configPath string

	flag.StringVar(&configPath, "config", "config.local.yml", "config 檔路徑")

	fmt.Println("configPath", configPath)
}
