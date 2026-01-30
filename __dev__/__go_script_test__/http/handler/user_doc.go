package handler

import (
	"fmt"
	"go_playground/model"
	"go_playground/util"
	"net/http"
	"reflect"
)

func UserDocHandler(w http.ResponseWriter, r *http.Request) {
	// 使用 reflect 分析 User struct
	userType := reflect.TypeOf(model.User{})
	tsType := util.GenerateTSType(userType)

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprint(w, tsType)
}
