/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue", 
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  darkMode: "class",
  theme: {
    // Enhanced responsive breakpoints
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
      // Custom breakpoints for specific use cases
      'mobile': {'max': '767px'},
      'tablet': {'min': '768px', 'max': '1023px'},
      'desktop': {'min': '1024px'},
      'touch': {'raw': '(hover: none)'},
      'mouse': {'raw': '(hover: hover)'}
    },
    extend: {
      colors: {
        background: {
          DEFAULT: 'transparent',
          dark: 'transparent'
        },
        foreground: {
          DEFAULT: '#000000',
          dark: '#ffffff'
        },
        primary: {
          DEFAULT: '#000000',
          foreground: '#ffffff'
        },
        secondary: {
          DEFAULT: '#f3f4f6',
          foreground: '#000000'
        },
        destructive: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff'
        },
        border: {
          DEFAULT: 'rgba(0, 0, 0, 0.1)',
          dark: 'rgba(255, 255, 255, 0.1)'
        },
        input: {
          DEFAULT: 'transparent'
        },
      },
      
      // Responsive spacing system
      spacing: {
        'xs': '0.25rem',     // 4px
        'sm': '0.5rem',      // 8px
        'md': '1rem',        // 16px
        'lg': '1.5rem',      // 24px
        'xl': '2rem',        // 32px
        '2xl': '3rem',       // 48px
        '3xl': '4rem',       // 64px
        '4xl': '6rem',       // 96px
        '5xl': '8rem',       // 128px
        
        // Safe area insets for mobile devices
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        
        // Container padding system
        'container-xs': '1rem',    // 16px
        'container-sm': '1.5rem',  // 24px
        'container-md': '2rem',    // 32px
        'container-lg': '2.5rem',  // 40px
        'container-xl': '3rem',    // 48px
      },
      
      // Enhanced border radius system
      borderRadius: {
        'none': '0',
        'xs': '0.125rem',    // 2px
        'sm': '0.25rem',     // 4px
        'md': '0.375rem',    // 6px
        'lg': '0.5rem',      // 8px
        'xl': '0.75rem',     // 12px
        '2xl': '1rem',       // 16px
        '3xl': '1.5rem',     // 24px
        'full': '9999px',
        
        // Responsive border radius (fallback to CSS vars)
        'responsive-sm': 'var(--radius-sm, 0.25rem)',
        'responsive-md': 'var(--radius-md, 0.375rem)',
        'responsive-lg': 'var(--radius-lg, 0.5rem)',
        'responsive-xl': 'var(--radius-xl, 0.75rem)',
      },
      
      // Enhanced typography system
      fontFamily: {
        sans: ['var(--font-family-brand)', 'system-ui', 'sans-serif'],
        brand: ['var(--font-family-brand)', 'system-ui', 'sans-serif'],
        doran: ['Doran', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'monospace']
      },
      
      // Responsive font sizes with fluid scaling
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],   // 14px
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.025em' }],      // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.025em' }],   // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0.025em' }],    // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0.025em' }],       // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '0.025em' }],  // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '0.025em' }],    // 36px
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '0.025em' }],            // 48px
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '0.025em' }],         // 60px
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '0.025em' }],          // 72px
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '0.025em' }],            // 96px
        '9xl': ['8rem', { lineHeight: '1', letterSpacing: '0.025em' }],            // 128px
        
        // Fluid responsive font sizes
        'fluid-sm': 'clamp(0.875rem, 2vw, 1rem)',           // 14px - 16px
        'fluid-base': 'clamp(1rem, 2.5vw, 1.125rem)',       // 16px - 18px
        'fluid-lg': 'clamp(1.125rem, 3vw, 1.25rem)',        // 18px - 20px
        'fluid-xl': 'clamp(1.25rem, 3.5vw, 1.5rem)',        // 20px - 24px
        'fluid-2xl': 'clamp(1.5rem, 4vw, 2rem)',            // 24px - 32px
        'fluid-3xl': 'clamp(1.875rem, 5vw, 3rem)',          // 30px - 48px
        'fluid-4xl': 'clamp(2.25rem, 6vw, 4rem)',           // 36px - 64px
        'fluid-5xl': 'clamp(3rem, 8vw, 6rem)',              // 48px - 96px
      },
      
      // Enhanced line height system
      lineHeight: {
        'none': '1',
        'tight': '1.25',
        'snug': '1.375',
        'normal': '1.5',
        'relaxed': '1.625',
        'loose': '2',
        '3': '.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '7': '1.75rem',
        '8': '2rem',
        '9': '2.25rem',
        '10': '2.5rem',
      },
      
      // Enhanced container system
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          xs: '1rem',
          sm: '1.5rem',
          md: '2rem',
          lg: '2.5rem',
          xl: '3rem',
          '2xl': '3rem',
        },
        screens: {
          xs: '475px',
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1400px',
        }
      },
      
      // Enhanced shadow system
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
        
        // Mobile-friendly shadows
        'mobile': '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        'mobile-lg': '0 4px 8px -2px rgba(0, 0, 0, 0.1)',
      },
      
      // Animation and transition enhancements
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      
      // Z-index system
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
        'max': '9999',
      },
      
      // Grid system enhancements
      gridTemplateColumns: {
        'auto-fill-xs': 'repeat(auto-fill, minmax(8rem, 1fr))',
        'auto-fill-sm': 'repeat(auto-fill, minmax(12rem, 1fr))',
        'auto-fill-md': 'repeat(auto-fill, minmax(16rem, 1fr))',
        'auto-fill-lg': 'repeat(auto-fill, minmax(20rem, 1fr))',
        'auto-fill-xl': 'repeat(auto-fill, minmax(24rem, 1fr))',
        'auto-fit-xs': 'repeat(auto-fit, minmax(8rem, 1fr))',
        'auto-fit-sm': 'repeat(auto-fit, minmax(12rem, 1fr))',
        'auto-fit-md': 'repeat(auto-fit, minmax(16rem, 1fr))',
        'auto-fit-lg': 'repeat(auto-fit, minmax(20rem, 1fr))',
        'auto-fit-xl': 'repeat(auto-fit, minmax(24rem, 1fr))',
      },
      
      // Touch-friendly sizing
      minHeight: {
        'touch': '44px',      // iOS minimum touch target
        'touch-md': '48px',   // Material Design minimum
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      
      minWidth: {
        'touch': '44px',
        'touch-md': '48px',
      },
      
      // Aspect ratio utilities
      aspectRatio: {
        'auto': 'auto',
        'square': '1 / 1',
        'video': '16 / 9',
        'photo': '4 / 3',
        'golden': '1.618 / 1',
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class'
    }),
    // Custom plugin for responsive utilities
    function({ addUtilities, theme, addComponents }) {
      // Add container padding utilities
      const containerPadding = {
        '.container-padding': {
          'padding-left': theme('spacing.container-xs'),
          'padding-right': theme('spacing.container-xs'),
          '@media (min-width: 640px)': {
            'padding-left': theme('spacing.container-sm'),
            'padding-right': theme('spacing.container-sm'),
          },
          '@media (min-width: 768px)': {
            'padding-left': theme('spacing.container-md'),
            'padding-right': theme('spacing.container-md'),
          },
          '@media (min-width: 1024px)': {
            'padding-left': theme('spacing.container-lg'),
            'padding-right': theme('spacing.container-lg'),
          },
          '@media (min-width: 1280px)': {
            'padding-left': theme('spacing.container-xl'),
            'padding-right': theme('spacing.container-xl'),
          },
        }
      }
      
      // Add safe area utilities
      const safeAreaUtilities = {
        '.safe-top': {
          'padding-top': 'env(safe-area-inset-top)'
        },
        '.safe-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)'
        },
        '.safe-left': {
          'padding-left': 'env(safe-area-inset-left)'
        },
        '.safe-right': {
          'padding-right': 'env(safe-area-inset-right)'
        },
        '.safe-x': {
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)'
        },
        '.safe-y': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)'
        },
        '.safe-all': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-right': 'env(safe-area-inset-right)',
          'padding-bottom': 'env(safe-area-inset-bottom)',
          'padding-left': 'env(safe-area-inset-left)'
        }
      }
      
      // Add touch-friendly utilities
      const touchUtilities = {
        '.touch-target': {
          'min-height': theme('minHeight.touch'),
          'min-width': theme('minWidth.touch'),
        },
        '.touch-target-md': {
          'min-height': theme('minHeight.touch-md'),
          'min-width': theme('minWidth.touch-md'),
        }
      }
      
      // Add responsive text utilities
      const responsiveTextUtilities = {
        '.text-responsive': {
          'font-size': theme('fontSize.fluid-base'),
        },
        '.text-responsive-sm': {
          'font-size': theme('fontSize.fluid-sm'),
        },
        '.text-responsive-lg': {
          'font-size': theme('fontSize.fluid-lg'),
        },
        '.text-responsive-xl': {
          'font-size': theme('fontSize.fluid-xl'),
        },
        '.text-responsive-2xl': {
          'font-size': theme('fontSize.fluid-2xl'),
        },
        '.text-responsive-3xl': {
          'font-size': theme('fontSize.fluid-3xl'),
        },
        '.text-responsive-4xl': {
          'font-size': theme('fontSize.fluid-4xl'),
        },
        '.text-responsive-5xl': {
          'font-size': theme('fontSize.fluid-5xl'),
        },
      }
      
      addUtilities({
        ...containerPadding,
        ...safeAreaUtilities,
        ...touchUtilities,
        ...responsiveTextUtilities
      })
      
      // Add responsive components
      addComponents({
        '.btn-responsive': {
          '@apply px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base md:px-8 md:py-4 md:text-lg rounded-lg sm:rounded-xl transition-all duration-300 touch-target': {},
        },
        '.card-responsive': {
          '@apply bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm sm:shadow-md border border-gray-200 overflow-hidden': {},
        },
        '.input-responsive': {
          '@apply w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base md:text-lg border-2 rounded-lg sm:rounded-xl transition-all duration-300 touch-target': {},
        }
      })
    }
  ]
}
