<script setup>
import { Button } from 'lib_comp'

const showAlert = () => {
  alert('Hello!')
}
</script>

<template>
  <div class="flex gap-2 p-4 border border-gray-200 rounded-lg">
    <Button @click="showAlert">預設按鈕</Button>
    <Button type="submit" class="!bg-blue-500 !text-white !border-blue-600">提交按鈕</Button>
    <Button disabled>禁用按鈕</Button>
  </div>
</template>
