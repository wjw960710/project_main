<script setup lang="ts">
import Button from '@/component/Button.vue';

const handleClick = () => {
  alert('Button clicked!');
};
</script>

<template>
  <div class="p-4">
    <h1 class="c-green-7 text-2xl font-bold mb-4">You did it!</h1>
    <p class="mb-4">
      Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
      documentation
    </p>

    <div class="flex gap-2">
      <Button @click="handleClick">Default Button</Button>
      <Button type="submit" @click="handleClick" class="!bg-blue-500 !text-white !border-blue-600">
        Submit Button
      </Button>
      <Button disabled @click="handleClick">Disabled Button</Button>
    </div>
  </div>
</template>

<style scoped></style>
