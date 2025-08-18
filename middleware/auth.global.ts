// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(() => {
  // هیچ احراز هویتی انجام نمی‌دهیم
  // فقط از لاگین به داشبورد هدایت می‌کنیم اگر کاربر لاگین کرده باشد
  
  //if (process.server) return

  //const { user } = useAuth()

  // اگر کاربر لاگین کرده و در صفحه لاگین است، به صفحه اصلی برود
//  if (user.value && to.path === '/login') {
   // return navigateTo('/user-dashboard')
 // }
})