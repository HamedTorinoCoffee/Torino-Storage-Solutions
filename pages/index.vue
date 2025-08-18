<!-- pages/index.vue -->
<template>
  <div class="loading-container">
    <div class="loading-content">
      <div class="logo-container">
        <img 
          src="/logo.png" 
          alt="Never Say No"
          class="logo-image"
        >
      </div>
      <div class="spinner-container">
        <div class="spinner"></div>
      </div>
      <p class="loading-text">در حال بارگذاری...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { navigateTo } from '#app'

// Auth composable
const { user, isLoading: authLoading } = useAuth()

// Runtime config
const config = useRuntimeConfig()
const adminEmail = config.public.firstAdminEmail || ''

// Check auth on mount and redirect accordingly
onMounted(async () => {
  console.log('🏠 Index page mounted - checking authentication...')
  
  // Wait for auth state to load
  let attempts = 0
  while (authLoading.value && attempts < 30) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  console.log('🔍 Auth check complete - User:', user.value)
  
  // Redirect based on authentication status
  if (!user.value) {
    console.log('❌ No user found, redirecting to login')
    await navigateTo('/login')
  } else if (user.value.email === adminEmail) {
    console.log('🔐 Admin user detected, redirecting to admin panel')
    await navigateTo('/admin/admin-index')
  } else {
    console.log('👤 Regular user detected, redirecting to user dashboard')
    await navigateTo('/user-dashboard')
  }
})
</script>

<style scoped>
.loading-container {
  min-height: 100vh;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-content {
  text-align: center;
}

.logo-container {
  width: 80px;
  height: 80px;
  margin: 0 auto 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #555;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spinner-container {
  margin-bottom: 24px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #b0b0b0;
  font-size: 14px;
  margin: 0;
}
</style>