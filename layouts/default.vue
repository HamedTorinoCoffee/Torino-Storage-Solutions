<!-- layouts/default.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useRouter, useRoute } from 'vue-router'

// Get login status
const { user, isApproved } = useAuth()
// Import signOut from its correct source if needed, e.g.:
// import { signOut } from '~/composables/useAuth'
const menuOpen = ref(false)
const router = useRouter()
const route = useRoute()

// Define menu options
const menuOptions = [
  { label: 'داشبورد', key: '/' },
  { label: 'اسکن بارکد', key: '/scan' },
  { label: 'محصولات', key: '/products' },
  { label: 'گزارش‌ها', key: '/reports' },
  ...(isApproved.value ? [{ label: 'مدیریت', key: '/admin' }] : [])
]

function onSelect(key: string) {
  router.push(key)
  menuOpen.value = false
}

async function onLogout() {
  const auth = getAuth()
  await signOut(auth)
  menuOpen.value = false
  router.push('/login')
}
</script>

<template>
  <div style="min-height: 100vh; display: flex; flex-direction: column; text-align: center;">
    <!-- Header -->
    <header style="padding: 1rem 0; border-bottom: 1px solid #ccc; position: relative;">
      <h1 style="margin: 0 auto; display: inline-block;">سیستم انبارداری</h1>
      <button @click="menuOpen = !menuOpen" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);">منو</button>
    </header>

    <!-- Mobile Drawer -->
    <div v-if="menuOpen" style="position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 280px; height: 100vh; padding: 2rem; z-index: 50; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
      <ul style="list-style: none; padding: 0; margin: 0; text-align: center;">
        <li v-for="option in menuOptions" :key="option.key" style="margin-bottom: 1rem;">
          <button @click="onSelect(option.key)" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">{{ option.label }}</button>
        </li>
      </ul>
      <hr style="margin: 1rem 0; border: none; border-top: 1px solid #ccc;" />
      <div style="margin: 1rem 0; text-align: center;">{{ user?.email }}</div>
      <button @click="onLogout" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; margin-top: 1rem;">خروج</button>
    </div>

    <!-- Content -->
    <main style="flex: 1; width: 100%; max-width: 768px; margin: 0 auto; padding: 2rem; display: flex; flex-direction: column; align-items: center;">
      <slot />
    </main>

    <!-- Floating Scan Button -->
    <button
      v-if="route.path !== '/scan'"
      @click="router.push('/scan')"
      style="position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); padding: 0.75rem 2rem; border: 1px solid #ccc; border-radius: 4px; background: white;">
      اسکن
    </button>
  </div>
</template>
