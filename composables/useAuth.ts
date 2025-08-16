import { ref, readonly, computed } from 'vue'
import { createClient } from '@supabase/supabase-js'
import { useRuntimeConfig } from '#imports'

// نوع داده کاربر Supabase
interface SupabaseUser {
  id: string
  email: string
  user_metadata: {
    first_name?: string
    last_name?: string
    full_name?: string
    sheet_name?: string // ← فیلد جدید برای نام sheet سفارشی
  }
  created_at: string
}

// Keep Supabase client at module level
let supabaseClient: any = null

export function useAuth() {
  const config = useRuntimeConfig()
  
  // Initialize Supabase only in client side
  if (typeof window !== 'undefined' && !supabaseClient) {
    try {
      // اول از config بخونیم
      let supabaseUrl = config.public.supabaseUrl as string
      let supabaseKey = config.public.supabaseAnonKey as string
      
      console.log('✅ Config loaded:', { url: !!supabaseUrl, key: !!supabaseKey })
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing from runtime config')
      }
      
      console.log('✅ Creating Supabase client...')
      supabaseClient = createClient(supabaseUrl, supabaseKey)
      console.log('✅ Supabase client created successfully')
    } catch (error) {
      console.error('Supabase initialization error:', error)
    }
  }

  const user = ref<SupabaseUser | null>(null)
  const isLoading = ref(true)
  const isApproved = ref(false)
  const isAdmin = ref(false)
  const error = ref<string | null>(null)

  // Computed برای احراز هویت
  const isAuthenticated = computed(() => !!user.value)

  // مانیتور وضعیت کاربر
  if (typeof window !== 'undefined' && supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (_event: string, session: any) => {
      if (session?.user) {
        user.value = session.user
        // بررسی admin بر اساس ایمیل
        const adminEmail = config.public.firstAdminEmail as string
        isAdmin.value = session.user.email?.toLowerCase() === adminEmail?.toLowerCase()
        isApproved.value = true // کاربران Supabase همگی تایید شده
      } else {
        user.value = null
        isApproved.value = false
        isAdmin.value = false
      }
      isLoading.value = false
    })

    // بررسی کاربر فعلی در شروع
    getCurrentUser()
  }

  // گرفتن کاربر فعلی
  async function getCurrentUser() {
    if (!supabaseClient) return null
    
    try {
      const { data: { user: currentUser }, error: userError } = await supabaseClient.auth.getUser()
      if (userError) throw new Error(userError.message || 'خطا در دریافت کاربر')
      
      user.value = currentUser
      if (currentUser) {
        const adminEmail = config.public.firstAdminEmail as string
        isApproved.value = true // همه کاربران Supabase تایید شده
        isAdmin.value = currentUser.email?.toLowerCase() === adminEmail?.toLowerCase()
      }
      return currentUser
    } catch (error) {
      console.error('خطا در دریافت کاربر:', error)
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص'
      console.warn('User fetch error:', errorMessage)
      user.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  // تابع کمکی برای تولید نام sheet یکتا و معتبر
  function generateSheetName(email: string): string {
    // همیشه از ایمیل استفاده کن برای یکتا بودن
    // حذف @ و دامنه و تبدیل کاراکترهای خاص به _
    const emailName = email.split('@')[0]
    return emailName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_')
  }

  // ثبت‌نام با ایمیل
  async function register(email: string, password: string, firstName: string, lastName: string) {
    error.value = null
    isLoading.value = true
    try {
      // تولید نام sheet یکتا
      const sheetName = generateSheetName(email)
      
      const { data, error: signUpError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            sheet_name: sheetName // ← نام sheet یکتا
          }
        }
      })

      if (signUpError) throw new Error(signUpError.message || 'خطا در ثبت‌نام')

      // ذخیره پروفایل در جدول profiles (اختیاری)
      if (data.user) {
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .upsert([{
            id: data.user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            sheet_name: sheetName,
            updated_at: new Date().toISOString()
          }], { onConflict: 'id' })
        
        if (profileError) {
          console.warn('خطا در ذخیره پروفایل:', profileError)
        }
      }

      isLoading.value = false
      return { success: true, user: data.user }
    } catch (e: any) {
      error.value = getErrorMessage(e.message)
      isLoading.value = false
      return { success: false, error: error.value }
    }
  }

  // ورود با ایمیل
  async function login(email: string, password: string) {
    error.value = null
    isLoading.value = true
    try {
      if (!supabaseClient) {
        throw new Error('Supabase not initialized')
      }

      const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw new Error(signInError.message || 'خطا در ورود')

      // بررسی و آپدیت sheet_name اگر موجود نیست
      if (data.user && !data.user.user_metadata?.sheet_name) {
        // دریافت اطلاعات از جدول profiles
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('sheet_name, first_name, last_name')
          .eq('id', data.user.id)
          .single()
        
        let sheetName = profileData?.sheet_name
        
        // اگر sheet_name در profile هم نبود، یکی بسازیم
        if (!sheetName) {
          sheetName = generateSheetName(data.user.email || '')
          
          // آپدیت metadata کاربر
          const { error: updateError } = await supabaseClient.auth.updateUser({
            data: {
              ...data.user.user_metadata,
              sheet_name: sheetName
            }
          })
          
          if (!updateError) {
            // آپدیت profile
            await supabaseClient
              .from('profiles')
              .upsert([{
                id: data.user.id,
                email: data.user.email,
                sheet_name: sheetName,
                updated_at: new Date().toISOString()
              }], { onConflict: 'id' })
          }
        } else {
          // اگر در profile بود ولی در metadata نبود، metadata رو آپدیت کن
          await supabaseClient.auth.updateUser({
            data: {
              ...data.user.user_metadata,
              sheet_name: sheetName
            }
          })
        }
      }

      user.value = data.user
      isLoading.value = false
      return { success: true, user: data.user }
    } catch (e: any) {
      console.error('Login error:', e)
      error.value = getErrorMessage(e.message)
      isLoading.value = false
      return { success: false, error: error.value }
    }
  }

  // ورود با گوگل (فعلاً غیرفعال - می‌تونیم بعداً اضافه کنیم)
  async function loginWithGoogle() {
    error.value = 'ورود با گوگل فعلاً در دسترس نیست'
    return { success: false, error: error.value }
  }

  // خروج
  async function logout() {
    error.value = null
    isLoading.value = true
    try {
      const { error: signOutError } = await supabaseClient.auth.signOut()
      if (signOutError) throw new Error(signOutError.message || 'خطا در خروج')
      
      user.value = null
      isApproved.value = false
      isAdmin.value = false
      
      isLoading.value = false
      return { success: true }
    } catch (e: any) {
      error.value = getErrorMessage(e.message)
      isLoading.value = false
      return { success: false, error: error.value }
    }
  }

  // ذخیره اسکن (نسخه کامل اصلاح شده)
  async function saveScan(scanData: { value: string, type: string }) {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        throw new Error('کاربر وارد نشده است')
      }

      // دریافت sheet_name از متادیتا یا profiles
      let sheetName = currentUser.user_metadata?.sheet_name
      
      // اگر در metadata نبود، از profiles بخوان
      if (!sheetName) {
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('sheet_name, first_name, last_name')
          .eq('id', currentUser.id)
          .single()
        
        sheetName = profileData?.sheet_name
        
        // اگر هنوز هم نبود، یکی بساز و ذخیره کن
        if (!sheetName) {
          sheetName = generateSheetName(currentUser.email || 'unknown')
          
          // آپدیت metadata
          await supabaseClient.auth.updateUser({
            data: {
              ...currentUser.user_metadata,
              sheet_name: sheetName
            }
          })
          
          // آپدیت profile
          await supabaseClient
            .from('profiles')
            .upsert([{
              id: currentUser.id,
              email: currentUser.email,
              sheet_name: sheetName,
              updated_at: new Date().toISOString()
            }], { onConflict: 'id' })
        }
      }
      
      const userEmail = currentUser.email || 'unknown@email.com'
      
      console.log('📋 Sheet Name برای این کاربر:', sheetName)
      console.log('👤 اطلاعات کاربر:', {
        id: currentUser.id,
        email: userEmail,
        metadata: currentUser.user_metadata,
        finalSheetName: sheetName
      })
      
      // برای نام کامل
      const userFullName = currentUser.user_metadata?.full_name || 
                          `${currentUser.user_metadata?.first_name || ''} ${currentUser.user_metadata?.last_name || ''}`.trim() ||
                          userEmail

      const scanRecord = {
        user_id: currentUser.id,
        user_email: userEmail,
        user_full_name: userFullName,
        user_sheet_name: sheetName, // ← استفاده از نام sheet ثابت و یکتا
        barcode_value: scanData.value,
        barcode_type: scanData.type,
        device_type: typeof window !== 'undefined' ? 'Web' : 'Mobile',
        scanned_at: new Date().toISOString(),
        synced_to_sheets: false
      }

      // ذخیره در Supabase
      const { data, error: insertError } = await supabaseClient
        .from('scans')
        .insert([scanRecord])
        .select()
        .single()

      if (insertError) throw new Error(insertError.message || 'خطا در ذخیره اسکن')

      // ارسال به Google Sheets
      try {
        const response = await $fetch('/api/sheets/add-scan', {
          method: 'POST',
          body: {
            ...scanRecord,
            id: data.id
          }
        })
        
        console.log('✅ Response from Google Sheets API:', response)

        // آپدیت وضعیت sync
        await supabaseClient
          .from('scans')
          .update({ synced_to_sheets: true })
          .eq('id', data.id)

      } catch (sheetsError) {
        console.error('❌ خطا در ارسال به Google Sheets:', sheetsError)
        // اسکن ذخیره شده ولی sync نشده
      }

      return { success: true, data }
    } catch (error: any) {
      console.error('خطا در ذخیره اسکن:', error)
      return { success: false, error: error.message }
    }
  }

  // دریافت تاریخچه اسکن‌ها (تابع جدید)
  async function getUserScans(limit: number = 50) {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) return { success: false, error: 'کاربر وارد نشده' }

      const { data, error: fetchError } = await supabaseClient
        .from('scans')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('scanned_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw new Error(fetchError.message || 'خطا در دریافت داده‌ها')

      return { success: true, data }
    } catch (error: any) {
      console.error('خطا در دریافت تاریخچه:', error)
      return { success: false, error: error.message }
    }
  }

  // تابع کمکی برای تبدیل کدهای خطای Supabase به پیام فارسی
  function getErrorMessage(errorMessage: string): string {
    const errorMessages: { [key: string]: string } = {
      'Invalid login credentials': 'ایمیل یا رمز عبور اشتباه است',
      'Email not confirmed': 'ایمیل تایید نشده است',
      'User not found': 'کاربری با این ایمیل یافت نشد',
      'Invalid email': 'ایمیل نامعتبر است',
      'Password should be at least 6 characters': 'رمز عبور باید حداقل ۶ کاراکتر باشد',
      'User already registered': 'این ایمیل قبلاً ثبت شده است',
      'Network error': 'خطا در اتصال به اینترنت',
      'Too many requests': 'تعداد درخواست‌ها زیاد است. لطفاً بعداً تلاش کنید'
    }
    
    // جستجوی کلیدواژه‌ها در پیام خطا
    for (const [key, value] of Object.entries(errorMessages)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return value
      }
    }
    
    return errorMessage || 'خطایی رخ داده است'
  }

  return {
    // State
    user: readonly(user),
    isLoading: readonly(isLoading),
    isApproved: readonly(isApproved),
    isAdmin: readonly(isAdmin),
    isAuthenticated,
    error: readonly(error),
    
    // Methods
    register,
    login,
    loginWithGoogle,
    logout,
    getCurrentUser,
    saveScan,
    getUserScans,
    
    // Supabase client (برای دسترسی مستقیم در صورت نیاز)
    supabase: supabaseClient
  }
}
