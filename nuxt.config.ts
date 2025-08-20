export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  
  modules: [
    '@nuxt/ui',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode'
  ],

  css: [
    '~/assets/css/fonts.css',
    '~/assets/css/tailwind.css'
  ],

  // 🔥 FIXED: Changed to Vercel preset
  nitro: {
    preset: 'vercel'
  },
  
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
      googleSheetId: process.env.GOOGLE_SHEET_ID || '',
      firstAdminEmail: process.env.NUXT_PUBLIC_FIRST_ADMIN_EMAIL || 'h.aghasi@torino.company',
    }
  },

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.js',
  },

  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light',
  },

  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
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
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'description', content: 'سیستم مدیریت انبار هوشمند شرکت تورینو' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  build: {
    transpile: ['@heroicons/vue']
  },

  vite: {
    define: {
      'process.env.DEBUG': false,
    },
    build: {
      sourcemap: false,
    }
  },

  typescript: {
    strict: false,
    typeCheck: false,
    shim: false
  }
})