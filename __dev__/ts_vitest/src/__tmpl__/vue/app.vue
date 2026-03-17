<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
const add = () => count.value++
const sub = () => count.value--
</script>

<template>
  <div class="w-full h-screen flex justify-center items-center gap-4">
    <button class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors" @click="sub">-</button>
    <div class="text-2xl font-bold font-mono min-w-[3rem] text-center">{{ count }}</div>
    <button class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors" @click="add">+</button>
  </div>
</template>
