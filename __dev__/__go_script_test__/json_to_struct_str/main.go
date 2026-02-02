package main

import (
	"encoding/json"
	"fmt"
)

var jsonstr = `{
  "name": "frank",
  "age": 29,
  "jobs": ["developer", "designer"]
}`

func main() {
	json2StructStr("User", jsonstr)
}

func json2StructStr(name string, jsonstr string) {
	var jmap map[string]any

	var err = json.Unmarshal([]byte(jsonstr), &jmap)
	if err != nil {
		panic(err)
		return
	}

	var result = "type " + name + " struct {\n"
	for k, v := range jmap {
		switch v.(type) {
		case string:
			fmt.Println(k, ":", v)
			result += fmt.Sprintf("  %s string `json:\"%s\"`\n", k, k)
		case float64, int:
			fmt.Println(k, ":", v)
			result += fmt.Sprintf("  %s int `json:\"%s\"`\n", k, k)
		case []any:
			fmt.Println(k, ":", v)
			result += fmt.Sprintf("  %s []any `json:\"%s\"`\n", k, k)
		}
	}
	result += "}"

	fmt.Println("jmap", jmap)
	fmt.Println("result", result)
}
