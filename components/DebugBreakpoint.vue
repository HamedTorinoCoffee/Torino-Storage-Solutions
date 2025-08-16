<template>
  <div v-if="showDebug" class="fixed bottom-4 left-4 z-50 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-mono">
    <span class="inline-block sm:hidden">xs</span>
    <span class="hidden sm:inline-block md:hidden">sm</span>
    <span class="hidden md:inline-block lg:hidden">md</span>
    <span class="hidden lg:inline-block xl:hidden">lg</span>
    <span class="hidden xl:inline-block">xl</span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showDebug = ref(false)

onMounted(() => {
  // فقط در حالت development نمایش بده
  showDebug.value = process.env.NODE_ENV === 'development'
})
</script>
