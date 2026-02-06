package main

import (
	"fmt"
	"load_env_yml/tool"
	"runtime/debug"
)

func main() {
	defer func() {
		if err := recover(); err != nil {
			fmt.Println(string(debug.Stack()))
		}
	}()

	env, err := tool.LoadEnv("config.local.yml")
	if err != nil {
		fmt.Println(err)
		return
	}

	fmt.Println(env.SSHHost)
}
