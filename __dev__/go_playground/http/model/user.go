package model

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
