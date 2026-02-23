# Button 按鈕組件

這是一個封裝原生按鈕屬性的基礎組件。

## 組件展示

<script setup>
import ButtonDemo from './src/example/ButtonDemo.vue'
</script>

<ButtonDemo />

## 基本用法

使用 `slot` 來傳遞按鈕文字或內容。

```vue
<template>
  <Button>點擊我</Button>
</template>

<script setup>
import { Button } from 'lib_comp'
</script>
```

## 屬性 (Props)

此組件支持所有原生的 `button` 屬性，例如：

- `type`: `button`, `submit`, `reset` (預設為 `button`)
- `disabled`: 是否禁用按鈕
- `class`, `style`: 自定義樣式
- 以及其他所有原生 HTML 屬性

## 插槽 (Slots)

| 插槽名稱 | 描述 |
| --- | --- |
| `default` | 按鈕的顯示內容，通常為文字或圖標 |

## 事件 (Events)

支持所有原生的 `button` 事件，如 `@click`, `@mousedown` 等。
