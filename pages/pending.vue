<!-- pages/pending.vue -->
<template>
  <div class="relative h-screen flex flex-col items-center justify-center">
    <div class="app-background"></div>
    
    <div class="glass-card p-6 sm:p-8 w-full max-w-md mx-4 text-center">
      <!-- Icon -->
      <div class="mb-6">
        <div class="w-20 h-20 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center animate-pulse">
          <svg class="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>
      
      <h1 class="text-xl sm:text-2xl font-bold mb-4">در انتظار تایید</h1>
      
      <!-- User Info -->
      <div v-if="user?.email" class="mb-6">
        <p class="text-gray-400 text-sm">حساب کاربری:</p>
        <p class="text-white font-medium">{{ user.email }}</p>
      </div>
      
      <p class="text-gray-400 mb-6 text-sm sm:text-base">
        حساب کاربری شما با موفقیت ایجاد شد و در حال حاضر منتظر تایید مدیر سیستم است.
      </p>
      
      <!-- Info Box -->
      <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
        <p class="text-sm text-blue-400">
          معمولاً این فرآیند کمتر از ۲۴ ساعت طول می‌کشد. پس از تایید، می‌توانید وارد سیستم شوید.
        </p>
      </div>
      
      <!-- Progress Steps -->
      <div class="mb-8">
        <div class="flex items-center justify-center space-x-reverse space-x-4">
          <!-- Step 1: ثبت نام -->
          <div class="text-center">
            <div class="w-10 h-10 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mb-2">
              <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <p class="text-xs text-gray-400">ثبت‌نام</p>
          </div>
          
          <!-- Connector -->
          <div class="w-12 h-0.5 bg-gray-700"></div>
          
          <!-- Step 2: تایید ادمین -->
          <div class="text-center">
            <div class="w-10 h-10 bg-yellow-500/20 border-2 border-yellow-500 rounded-full flex items-center justify-center mb-2 animate-pulse">
              <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p class="text-xs text-gray-400">تایید ادمین</p>
          </div>
          
          <!-- Connector -->
          <div class="w-12 h-0.5 bg-gray-700"></div>
          
          <!-- Step 3: دسترسی -->
          <div class="text-center opacity-50">
            <div class="w-10 h-10 bg-gray-700 border-2 border-gray-600 rounded-full flex items-center justify-center mb-2">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p class="text-xs text-gray-400">دسترسی کامل</p>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="space-y-3">
        <button
          @click="refreshPage"
          :disabled="isRefreshing"
          class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all flex items-center justify-center"
        >
          <svg v-if="!isRefreshing" class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span v-if="isRefreshing" class="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2"></span>
          {{ isRefreshing ? 'در حال بررسی...' : 'بررسی وضعیت' }}
        </button>
        
        <button
          @click="handleLogout"
          class="w-full py-2 px-4 border border-gray-700 hover:bg-gray-800/50 rounded-lg text-gray-400 hover:text-white font-medium transition-all"
        >
          خروج از حساب
        </button>
      </div>
      
      <!-- Last Check Time -->
      <p v-if="lastCheckTime" class="mt-4 text-xs text-gray-500">
        آخرین بررسی: {{ formatTime(lastCheckTime) }}
      </p>
      
      <!-- Auto Check Info -->
      <p class="mt-2 text-xs text-gray-600">
        صفحه هر ۳۰ ثانیه به صورت خودکار بروز می‌شود
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user, logout } = useAuth()
const router = useRouter()

const isRefreshing = ref(false)
const lastCheckTime = ref<Date | null>(null)
let autoRefreshInterval: NodeJS.Timeout | null = null

// بررسی وضعیت با refresh صفحه
const refreshPage = async () => {
  isRefreshing.value = true
  
  try {
    // صبر کنید تا انیمیشن نمایش داده شود
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Refresh صفحه برای بررسی مجدد وضعیت
    await router.replace({ path: '/pending', force: true })
    
    lastCheckTime.value = new Date()
  } catch (error) {
    console.error('Error refreshing:', error)
  } finally {
    isRefreshing.value = false
  }
}

// خروج از حساب
const handleLogout = async () => {
  await logout()
  await router.push('/login')
}

// فرمت زمان
const formatTime = (date: Date) => {
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diff < 60) return 'همین الان'
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`
  return `${Math.floor(diff / 86400)} روز پیش`
}

// بررسی خودکار هر 30 ثانیه
onMounted(() => {
  // تنظیم زمان آخرین بررسی
  lastCheckTime.value = new Date()
  
  // شروع refresh خودکار
  autoRefreshInterval = setInterval(() => {
    refreshPage()
  }, 30000) // هر 30 ثانیه
})

// پاکسازی interval
onUnmounted(() => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
  }
})

// اگر کاربر لاگین نیست، به صفحه لاگین برود
onMounted(() => {
  if (!user.value) {
    router.push('/login')
  }
})
</script>

<style scoped>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
</style>