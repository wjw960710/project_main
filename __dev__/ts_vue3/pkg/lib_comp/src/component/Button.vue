<script setup lang="ts">
import { useAttrs } from 'vue';

defineOptions({
  inheritAttrs: false,
});

const attrs = useAttrs();
</script>

<template>
  <button
    v-bind="attrs"
    class="px-4 py-2 rounded border border-gray-300 bg-white cursor-pointer transition-all duration-200 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <slot />
  </button>
</template>

<style scoped></style>
