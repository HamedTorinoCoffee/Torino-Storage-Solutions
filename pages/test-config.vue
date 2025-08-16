<template>
  <div class="p-8">
    <h1 class="text-2xl mb-4">تست تنظیمات</h1>
    <p>ایمیل ادمین: {{ adminEmail }}</p>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()
const adminEmail = config.public.firstAdminEmail

console.log('Admin Email:', adminEmail)
</script>
