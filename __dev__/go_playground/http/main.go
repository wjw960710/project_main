package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"reflect"
	"strings"
)

// User 定義回應的資料結構
// 使用 struct tag (`json:"..."`) 來指定 JSON 鍵名
type User struct {
	Name string `json:"name" doc:"姓名"`
	// 在 Go 中，可為 null 的字串通常使用 *string (指標)
	// 如果是 nil，編碼後就會是 null
	Age        *string         `json:"age" doc:"年齡"`
	Works      []string        `json:"works" doc:"工作技能列表"`
	HealthInfo []HealthInfo    `json:"healthInfo" doc:"健檢資料"`
	Family     map[string]User `json:"family" doc:"家庭成員"`
}

type HealthInfo struct {
	CreateTime         int                 `json:"createTime" doc:"檢查時間"`
	Height             int                 `json:"height" doc:"身高"`
	Weight             int                 `json:"weight" doc:"體重"`
	AdditionalFeeItems []AdditionalFeeItem `json:"additionalFeeItems" doc:"加費項目列表"`
	Price              int                 `json:"price" doc:"總費用"`
}

type AdditionalFeeItem struct {
	Name  string `json:"name" doc:"項目名稱"`
	Price int    `json:"price" doc:"費用"`
}

func userHandler(w http.ResponseWriter, r *http.Request) {
	// 1. 檢查是否為 GET 請求 (Go 1.22 以前需要這樣判斷)
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 2. 準備資料
	var ageValue *string // 模擬有資料的情況
	// 如果要讓 age 為 null，只需將 Age 設為 nil

	data := User{
		Name:  "小明",
		Age:   ageValue, // 傳遞指標以支援 null
		Works: []string{"Golang Engineer", "Backend Developer"},
		HealthInfo: []HealthInfo{
			HealthInfo{
				CreateTime: 1671234567,
				Height:     180,
				Weight:     80,
				AdditionalFeeItems: []AdditionalFeeItem{
					AdditionalFeeItem{
						Name:  "肺部超音波",
						Price: 100,
					},
				},
				Price: 200,
			},
			HealthInfo{
				CreateTime: 1948192131,
				Height:     180,
				Weight:     72,
				AdditionalFeeItems: []AdditionalFeeItem{
					AdditionalFeeItem{
						Name:  "視力測驗",
						Price: 20,
					},
					AdditionalFeeItem{
						Name:  "蟯蟲檢驗",
						Price: 70,
					},
				},
				Price: 190,
			},
		},
		Family: map[string]User{
			"father": {
				Name:  "大明",
				Age:   func() *string { age := "50"; return &age }(),
				Works: []string{"Manager"},
			},
			"mother": {
				Name:  "阿花",
				Age:   func() *string { age := "48"; return &age }(),
				Works: []string{"Teacher"},
			},
		},
	}

	// 3. 設定 Response Header 為 JSON 格式
	w.Header().Set("Content-Type", "application/json")

	// 4. 將結構體轉為 JSON 並寫入回應
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("JSON encoding failed: %v", err)
	}
}

func userDocHandler(w http.ResponseWriter, r *http.Request) {
	// 使用 reflect 分析 User struct
	userType := reflect.TypeOf(User{})
	tsType := generateTSType(userType)

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprint(w, tsType)
}

func generateTSType(t reflect.Type) string {
	var builder strings.Builder
	typeName := t.Name()

	builder.WriteString(fmt.Sprintf("type %s = {\n", typeName))

	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)

		// 取得 json tag 作為屬性名稱
		jsonTag := field.Tag.Get("json")
		if jsonTag == "" || jsonTag == "-" {
			continue
		}

		// 處理 json tag 中的選項 (如 "name,omitempty")
		fieldName := strings.Split(jsonTag, ",")[0]

		// 取得 doc tag 作為備註名稱
		docTag := field.Tag.Get("doc")

		// 轉換 Go 類型到 TypeScript 類型
		tsFieldType := goTypeToTSType(field.Type)

		// 修改這裡：改成行內註解格式
		docComment := emptyDocWith(docTag, "", func(s string) string {
			return fmt.Sprintf(" // %s", s)
		})

		builder.WriteString(fmt.Sprintf("  %s: %s%s\n", fieldName, tsFieldType, docComment))
	}

	builder.WriteString("}")

	return builder.String()
}

func emptyDocWith(txt string, nstr string, customizers ...func(string) string) string {
	if txt == "" || txt == "-" {
		return nstr
	}

	if customizers != nil {
		return customizers[0](txt)
	}

	return txt
}

func goTypeToTSType(t reflect.Type) string {
	switch t.Kind() {
	case reflect.String:
		return "string"

	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
		reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64,
		reflect.Float32, reflect.Float64:
		return "number"

	case reflect.Bool:
		return "boolean"

	case reflect.Slice, reflect.Array:
		elemType := goTypeToTSType(t.Elem())
		return fmt.Sprintf("%s[]", elemType)

	case reflect.Ptr:
		// 指標類型表示可以是 null
		innerType := goTypeToTSType(t.Elem())
		return fmt.Sprintf("%s | null", innerType)

	case reflect.Map:
		keyType := goTypeToTSType(t.Key())
		valueType := goTypeToTSType(t.Elem())
		return fmt.Sprintf("Record<%s, %s>", keyType, valueType)

	case reflect.Interface:
		if t.String() == "interface {}" {
			return "any"
		}

		return "unknown"

	case reflect.Struct:
		// 對於命名的 struct，使用其類型名稱
		if t.Name() != "" {
			return t.Name()
		}
		// 對於匿名 struct，回傳 object
		return "object"

	default:
		return "unknown"
	}
}

const (
	port = 3313
)

func main() {
	// 註冊路由
	http.HandleFunc("/user", userHandler)
	http.HandleFunc("/doc/user", userDocHandler)

	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
		log.Fatal(err)
	}

	log.Println(fmt.Sprintf("伺服器啟動於 :%d...", port))
	fmt.Println("訪問 http://localhost:8080/user 查看 JSON 響應")
	fmt.Println("訪問 http://localhost:8080/doc/user 查看 TypeScript 類型定義")
}
