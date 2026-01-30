package handler

import (
	"encoding/json"
	"go_playground/model"
	"log"
	"net/http"
)

func UserHandler(w http.ResponseWriter, r *http.Request) {
	// 1. 檢查是否為 GET 請求 (Go 1.22 以前需要這樣判斷)
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 2. 準備資料
	var ageValue *string // 模擬有資料的情況
	// 如果要讓 age 為 null，只需將 Age 設為 nil

	data := model.User{
		Name:  "小明",
		Age:   ageValue, // 傳遞指標以支援 null
		Works: []string{"Golang Engineer", "Backend Developer"},
		HealthInfo: []model.HealthInfo{
			model.HealthInfo{
				CreateTime: 1671234567,
				Height:     180,
				Weight:     80,
				AdditionalFeeItems: []model.AdditionalFeeItem{
					{
						Name:  "肺部超音波",
						Price: 100,
					},
				},
				Price: 200,
			},
			model.HealthInfo{
				CreateTime: 1948192131,
				Height:     180,
				Weight:     72,
				AdditionalFeeItems: []model.AdditionalFeeItem{
					{
						Name:  "視力測驗",
						Price: 20,
					},
					{
						Name:  "蟯蟲檢驗",
						Price: 70,
					},
				},
				Price: 190,
			},
		},
		Family: map[string]model.User{
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
