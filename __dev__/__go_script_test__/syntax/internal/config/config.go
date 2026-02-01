package config

import "fmt"

type Config struct {
	Port string
}

var Http *Config

// 包的初始化函數，引入就被調用
func init() {
	fmt.Println("config init")
	Http = &Config{Port: ":8080"}
}

// 可以多次初始化
func init() {
	fmt.Println("config init2")
	Http = &Config{Port: ":８０８０"}
}
