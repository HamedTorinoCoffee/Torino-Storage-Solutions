import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin(() => {
  // موقتاً کاملاً غیرفعال
  console.log('🔌 Router auth plugin is DISABLED')
  
  // بعداً می‌تونید از کد زیر استفاده کنید
  /*
  const router = useRouter()
  
  nuxtApp.hook('app:mounted', () => {
    if (!document.cookie.includes('auth-token')) {
      router.push('/login')
    }
  })
  */
})