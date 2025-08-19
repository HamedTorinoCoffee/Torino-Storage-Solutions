// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  
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
      // Supabase settings
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      
      // Google Sheets settings
      googleSheetId: process.env.GOOGLE_SHEET_ID,
      
      // First admin email
      firstAdminEmail: process.env.NUXT_PUBLIC_FIRST_ADMIN_EMAIL || 'h.aghasi@torino.company',
      
      // Base URL - removed GitHub Pages specific config
      baseURL: ''
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

  // Static generation for Netlify
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: false,
      routes: ['/']
    }
  },

  // Add build configuration for googleapis
  build: {
    transpile: ['@heroicons/vue', 'googleapis']
  },

  // Development server configuration
  devServer: {
    host: 'localhost',
    port: 3000
  },

  vite: {
    css: {
      devSourcemap: false
    },
    build: {
      sourcemap: false
    },
    clearScreen: false
  },

  typescript: {
    strict: false,
    typeCheck: false
  }
})