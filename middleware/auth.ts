// middleware/auth.global.ts - موقتاً غیرفعال برای تست
export default defineNuxtRouteMiddleware((to, from) => {
  // موقتاً middleware رو غیرفعال می‌کنیم تا بتونیم برنامه رو تست کنیم
  return
  
  /* کد اصلی middleware - بعداً فعال می‌کنیم
  
  // فقط در client-side اجرا شود
  if (process.server) return

  const { user, isLoading, isApproved, isAdmin } = useAuth()

  // مسیرهای عمومی
  const publicRoutes = ['/login', '/register', '/forgot-password']
  
  // اگر در حال لود است، صبر کن
  if (isLoading.value) {
    return
  }

  // اگر کاربر لاگین نکرده و مسیر عمومی نیست
  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }

  // اگر کاربر لاگین کرده و در صفحات عمومی است
  if (user.value && publicRoutes.includes(to.path)) {
    return navigateTo('/')
  }

  // موقتاً بررسی approval را غیرفعال می‌کنیم چون همه approved هستند
  
  */
})