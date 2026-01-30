package util

import (
	"fmt"
	"reflect"
	"strings"
)

func GenerateTSType(t reflect.Type) string {
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
		docComment := EmptyWith(docTag, "", WithCustomizer(func(s string) string {
			return fmt.Sprintf(" // %s", s)
		}))

		builder.WriteString(fmt.Sprintf("  %s: %s%s\n", fieldName, tsFieldType, docComment))
	}

	builder.WriteString("}")

	return builder.String()
}

func goTypeToTSType(t reflect.Type, customizers ...func(reflect.Kind) string) string {
	result := "unknown"

	switch t.Kind() {
	case reflect.String:
		result = "string"
		break

	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
		reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64,
		reflect.Float32, reflect.Float64:
		result = "number"
		break

	case reflect.Bool:
		result = "boolean"
		break

	case reflect.Slice, reflect.Array:
		elemType := goTypeToTSType(t.Elem())
		result = fmt.Sprintf("%s[]", elemType)
		break

	case reflect.Ptr:
		// 指標類型表示可以是 null
		innerType := goTypeToTSType(t.Elem())
		result = fmt.Sprintf("%s | null", innerType)
		break

	case reflect.Map:
		keyType := goTypeToTSType(t.Key())
		valueType := goTypeToTSType(t.Elem())
		result = fmt.Sprintf("Record<%s, %s>", keyType, valueType)
		break

	case reflect.Interface:
		if t.String() == "interface {}" {
			result = "any"
			break
		}

		result = "unknown"
		break

	case reflect.Struct:
		// 對於命名的 struct，使用其類型名稱
		if t.Name() != "" {
			result = t.Name()
			break
		}

		// 對於匿名 struct，回傳 object
		result = "object"
		break
	}

	return result
}
