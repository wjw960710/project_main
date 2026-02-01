package handler

import (
	"fmt"
	"net/http"
)

func HttpHomeHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("r.URL.Query().Get(\"name\") = %s", r.URL.Query().Get("name"))
}
