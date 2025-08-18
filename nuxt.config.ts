// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  
  // GitHub Pages base URL (replace 'barcode-scanner' with your repo name)
  app: {
    baseURL: process.env.NODE_ENV === 'production' ? '/barcode-scanner/' : '/',
    buildAssetsDir: 'assets'
  },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode'
  ],

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.js',
    exposeConfig: true,
    viewer: true,
  },

  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light',
  },

  runtimeConfig: {
    // Private runtime config (only available on server-side)
    googleProjectId: process.env.GOOGLE_PROJECT_ID,
    googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY,
    googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    googleSheetId: process.env.GOOGLE_SHEET_ID,
    
    public: {
      // Supabase تنظیمات
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      
      // Google Sheets تنظیمات  
      googleSheetId: process.env.GOOGLE_SHEET_ID,
      
      // اضافه کردن ایمیل اولین ادمین
      firstAdminEmail: process.env.FIRST_ADMIN_EMAIL || 'admin@example.com',
      
      // Base URL برای اپ اندروید و وب - داینامیک
      baseURL: process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com'  // بعداً تغییر دهید
        : '' // خالی = از آدرس فعلی استفاده می‌کنه (داینامیک)
    }
  },

  css: [
    '~/assets/css/fonts.css',
    '~/assets/css/tailwind.css'
  ],

  app: {
    head: {
      htmlAttrs: {
        lang: 'fa',
        dir: 'rtl'
      },
      title: 'سیستم انبارداری هوشمند تورینو',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  nitro: {
    preset: 'static'
  },

  // Development server configuration با HTTPS
  devServer: {
    https: {
      // مسیر فایل‌های certificate
      key: './192.168.82.190+1-key.pem',
      cert: './192.168.82.190+1.pem'
    },
    host: 'localhost', // تغییر به localhost
    port: 3000
  },

  vite: {
    css: {
      devSourcemap: false
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        external: ['/logo.png']
      }
    },
    clearScreen: false,
    server: {
      // تنظیمات HTTPS برای Vite
      https: {
        key: './192.168.82.190+1-key.pem',
        cert: './192.168.82.190+1.pem'
      }
    }
  },

  typescript: {
    strict: false,
    typeCheck: false
  },

  build: {
    transpile: ['@heroicons/vue']
  }
})