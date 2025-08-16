<!-- pages/register.vue -->
<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
    <div style="width: 100%; max-width: 400px; padding: 2rem; text-align: center;">
      <h1 style="font-size: 1.5rem; margin-bottom: 2rem;">
        ثبت‌نام در کدبرگ
      </h1>
      
      <!-- نمایش خطا -->
      <div v-if="errorMessage" style="margin-bottom: 1rem; padding: 0.75rem; border: 1px solid #ef4444; border-radius: 4px; color: #ef4444; text-align: center;">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleRegister" style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- نام کامل -->
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <input
            v-model="formData.displayName"
            type="text"
            placeholder="نام و نام‌خانوادگی"
            required
            style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; text-align: center;"
            :disabled="isLoading"
          />
          <small style="color: #666; text-align: right;">حداقل ۳ کاراکتر</small>
        </div>
        
        <!-- ایمیل -->
        <div>
          <input
            v-model="formData.email"
            type="email"
            placeholder="ایمیل"
            required
            dir="ltr"
            style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; text-align: center;"
            :disabled="isLoading"
          />
        </div>
        
        <!-- رمز عبور -->
        <div>
          <input
            v-model="formData.password"
            type="password"
            placeholder="رمز عبور (حداقل ۶ کاراکتر)"
            required
            dir="ltr"
            minlength="6"
            style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; text-align: center;"
            :disabled="isLoading"
          />
        </div>
        
        <!-- تکرار رمز عبور -->
        <div>
          <input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="تکرار رمز عبور"
            required
            dir="ltr"
            style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; text-align: center;"
            :disabled="isLoading"
          />
        </div>
        
        <!-- دکمه ثبت‌نام -->
        <button
          type="submit"
          :disabled="isLoading || authLoading"
          style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; margin-top: 1rem;"
        >
          <span v-if="!isLoading">ثبت‌نام</span>
          <span v-else style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <span style="display: inline-block; width: 1.25rem; height: 1.25rem; border: 2px solid #ccc; border-top-color: #666; border-radius: 50%; animation: spin 1s linear infinite;"></span>
            در حال ثبت‌نام...
          </span>
        </button>
      </form>

      <!-- پیام خطا -->
      <Transition name="fade">
        <p v-if="errorMessage" class="mt-4 text-red-400 text-center text-sm">
          {{ errorMessage }}
        </p>
      </Transition>

      <!-- Divider -->
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-700"></div>
        </div>
        <div class="relative flex justify-center">
          <span class="bg-gray-900 px-4 text-sm text-gray-400">یا</span>
        </div>
      </div>

      <!-- ثبت‌نام با گوگل -->
      <button
        @click="handleGoogleRegister"
        :disabled="isLoading || authLoading"
        class="w-full border border-gray-700 hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center"
      >
        <svg class="w-5 h-5 ml-3" viewBox="0 0 24 24">
          <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        ثبت‌نام با گوگل
      </button>

      <!-- لینک ورود -->
      <div class="mt-6 text-center">
        <p class="text-gray-400 text-sm">
          قبلاً ثبت‌نام کردید؟
          <NuxtLink to="/login" class="text-blue-400 hover:text-blue-300 transition">
            وارد شوید
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { register, loginWithGoogle, isLoading: authLoading } = useAuth()

const isLoading = ref(false)
const errorMessage = ref('')

const formData = ref({
  displayName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// اعتبارسنجی رمز عبور
const validatePassword = (password: string) => {
  if (password.length < 8) return 'رمز عبور باید حداقل ۸ کاراکتر باشد'
  if (!/[A-Z]/.test(password)) return 'رمز عبور باید حداقل یک حرف بزرگ داشته باشد'
  if (!/[a-z]/.test(password)) return 'رمز عبور باید حداقل یک حرف کوچک داشته باشد'
  if (!/[0-9]/.test(password)) return 'رمز عبور باید حداقل یک عدد داشته باشد'
  return null
}

// مدیریت ثبت‌نام
const handleRegister = async () => {
  // اعتبارسنجی رمز عبور
  const passwordError = validatePassword(formData.value.password)
  if (passwordError) {
    errorMessage.value = passwordError
    return
  }

  // بررسی تطابق رمزها
  if (formData.value.password !== formData.value.confirmPassword) {
    errorMessage.value = 'رمز عبور و تکرار آن یکسان نیستند'
    return
  }

  // اعتبارسنجی نام کاربری
  if (formData.value.displayName.length < 3) {
    errorMessage.value = 'نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const result = await register(
      formData.value.email, 
      formData.value.password, 
      formData.value.displayName
    )
    
    if (result.success) {
      // هدایت به صفحه pending بعد از ثبت‌نام موفق
      await navigateTo('/pending')
    } else {
      errorMessage.value = translateError(result.error || 'خطا در ثبت‌نام')
    }
  } catch (err) {
    errorMessage.value = 'خطا در ثبت‌نام'
    console.error('Registration error:', err)
  } finally {
    isLoading.value = false
  }
}

// ثبت‌نام با گوگل
const handleGoogleRegister = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const result = await loginWithGoogle()
    
    if (result.success) {
      await navigateTo('/pending')
    } else {
      errorMessage.value = translateError(result.error || 'خطا در ثبت‌نام با گوگل')
    }
  } catch (err) {
    errorMessage.value = 'خطا در ثبت‌نام با گوگل'
    console.error('Google registration error:', err)
  } finally {
    isLoading.value = false
  }
}

// ترجمه خطاها
function translateError(error: string): string {
  const errorMap: Record<string, string> = {
    'email-already-in-use': 'این ایمیل قبلاً ثبت شده است',
    'weak-password': 'رمز عبور باید حداقل ۶ کاراکتر باشد',
    'invalid-email': 'ایمیل نامعتبر است',
    'network-request-failed': 'خطا در اتصال به اینترنت',
    'operation-not-allowed': 'این عملیات مجاز نیست',
    'too-many-requests': 'تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید'
  }
  
  // جستجو برای کلیدواژه‌ها در متن خطا
  for (const [key, value] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(key)) {
      return value
    }
  }
  
  return error
}

// پاک کردن خطا هنگام تایپ
watch(() => formData.value, () => {
  if (errorMessage.value) {
    errorMessage.value = ''
  }
}, { deep: true })
</script>

<style scoped>
/* انیمیشن fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* انیمیشن spin */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
