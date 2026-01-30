package main

import (
	"fmt"
	"go_playground/handler"
	"log"
	"net/http"
)

const (
	port = 3313
)

func main() {
	// 註冊路由
	http.HandleFunc("/user", handler.UserHandler)
	http.HandleFunc("/doc/user", handler.UserDocHandler)

	log.Println(fmt.Sprintf("伺服器啟動於 :%d...", port))
	log.Println("訪問 http://localhost:8080/user 查看 JSON 響應")
	log.Println("訪問 http://localhost:8080/doc/user 查看 TypeScript 類型定義")

	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
		log.Fatal(err)
	}
}
