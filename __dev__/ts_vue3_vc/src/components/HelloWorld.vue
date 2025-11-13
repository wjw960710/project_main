<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <h1 class="text-3.2em leading-1.1">{{ msg }}</h1>

  <div class="p-2em">
    <button type="button" @click="count++" class="rounded-lg border border-transparent px-1.2em py-0.6em text-1em font-medium font-inherit bg-[#1a1a1a] cursor-pointer transition-colors hover:border-[#646cff]">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank" class="font-medium text-[#646cff] no-underline hover:text-[#535bf2]"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Learn more about IDE Support for Vue in the
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      class="font-medium text-[#646cff] no-underline hover:text-[#535bf2]"
      >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="text-[#888]">Click on the Vite and Vue logos to learn more</p>
</template>
