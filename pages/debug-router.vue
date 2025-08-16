<!-- pages/debug-router.vue -->
<template>
  <div style="padding: 30px; background: #1a1a1a; min-height: 100vh; color: #fff; font-family: monospace;">
    <h1 style="color: #22c55e;">🔍 Router Debug Page</h1>
    
    <!-- Router Info -->
    <div style="background: #2a2a2a; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h2>📍 Router Information:</h2>
      <div>Current Path: <span style="color: #3b82f6;">{{ currentPath }}</span></div>
      <div>Route Name: <span style="color: #3b82f6;">{{ routeName }}</span></div>
      <div>Router Ready: <span :style="{color: routerReady ? '#22c55e' : '#ef4444'}">{{ routerReady }}</span></div>
    </div>

    <!-- Available Routes -->
    <div style="background: #2a2a2a; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h2>📋 Available Routes:</h2>
      <div v-for="route in routes" :key="route.path" style="margin: 5px 0;">
        • {{ route.path }} - {{ route.name || 'unnamed' }}
      </div>
    </div>

    <!-- Test Buttons -->
    <div style="background: #2a2a2a; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h2>🧪 Navigation Tests:</h2>
      
      <div style="display: grid; gap: 10px; max-width: 500px;">
        <!-- Test 1 -->
        <button @click="test1" style="padding: 12px; background: #333; border: 1px solid #555; color: white; text-align: left;">
          Test 1: Simple click handler
        </button>
        
        <!-- Test 2 -->
        <button @click="test2" style="padding: 12px; background: #333; border: 1px solid #555; color: white; text-align: left;">
          Test 2: navigateTo('/admin/outbound')
        </button>
        
        <!-- Test 3 -->
        <button @click="test3" style="padding: 12px; background: #333; border: 1px solid #555; color: white; text-align: left;">
          Test 3: $router.push('/admin/outbound')
        </button>
        
        <!-- Test 4 -->
        <button @click="test4" style="padding: 12px; background: #333; border: 1px solid #555; color: white; text-align: left;">
          Test 4: window.location.href
        </button>
        
        <!-- Test 5 -->
        <button @click="test5" style="padding: 12px; background: #333; border: 1px solid #555; color: white; text-align: left;">
          Test 5: Check if route exists
        </button>
        
        <!-- Test 6 -->
        <a href="/admin/outbound" style="display: block; padding: 12px; background: #333; border: 1px solid #555; color: white; text-decoration: none;">
          Test 6: Plain HTML anchor tag
        </a>
        
        <!-- Test 7 -->
        <NuxtLink to="/admin/outbound" style="display: block; padding: 12px; background: #333; border: 1px solid #555; color: white; text-decoration: none;">
          Test 7: NuxtLink component
        </NuxtLink>
      </div>
    </div>

    <!-- Console Output -->
    <div style="background: #000; padding: 20px; margin: 20px 0; border-radius: 8px; max-height: 400px; overflow-y: auto;">
      <h2 style="color: #22c55e;">📝 Console Output:</h2>
      <div v-for="(log, index) in logs" :key="index" :style="{color: log.color || '#fff', margin: '2px 0'}">
        {{ log.text }}
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="lastError" style="background: #7f1d1d; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h2 style="color: #ef4444;">❌ Last Error:</h2>
      <pre style="color: #fca5a5;">{{ lastError }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onErrorCaptured } from 'vue'
import { useRouter, useRoute, navigateTo } from '#app'

// Router & Route
const router = useRouter()
const route = useRoute()

// State
const currentPath = ref('')
const routeName = ref('')
const routerReady = ref(false)
const routes = ref([])
const logs = ref([])
const lastError = ref(null)

// Log function
function log(text, color = '#fff') {
  const timestamp = new Date().toLocaleTimeString()
  const logText = `[${timestamp}] ${text}`
  console.log(logText)
  logs.value.push({ text: logText, color })
}

// Error handler
onErrorCaptured((err) => {
  lastError.value = err.toString()
  log(`ERROR: ${err.toString()}`, '#ef4444')
  return false
})

// Lifecycle
onMounted(async () => {
  log('Page mounted', '#22c55e')
  
  // Get current route info
  currentPath.value = route.path
  routeName.value = route.name || 'unnamed'
  
  // Check if router is ready
  routerReady.value = router.isReady ? await router.isReady() : true
  log(`Router ready: ${routerReady.value}`, routerReady.value ? '#22c55e' : '#ef4444')
  
  // Get all routes
  if (router.options && router.options.routes) {
    routes.value = router.options.routes.map(r => ({
      path: r.path,
      name: r.name
    }))
    log(`Found ${routes.value.length} routes`, '#3b82f6')
  } else {
    log('Could not access router.options.routes', '#ef4444')
  }
  
  // Log router object
  console.log('Full router object:', router)
  console.log('Router methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(router)))
})

// Test functions
function test1() {
  log('Test 1: Button clicked!', '#22c55e')
  alert('Button click works!')
}

function test2() {
  log('Test 2: Calling navigateTo...', '#3b82f6')
  try {
    navigateTo('/admin/outbound')
    log('Test 2: navigateTo called', '#22c55e')
  } catch (err) {
    log(`Test 2: Error - ${err}`, '#ef4444')
    lastError.value = err.toString()
  }
}

function test3() {
  log('Test 3: Calling router.push...', '#3b82f6')
  try {
    router.push('/admin/outbound')
    log('Test 3: router.push called', '#22c55e')
  } catch (err) {
    log(`Test 3: Error - ${err}`, '#ef4444')
    lastError.value = err.toString()
  }
}

function test4() {
  log('Test 4: Using window.location.href...', '#3b82f6')
  window.location.href = '/admin/outbound'
}

function test5() {
  log('Test 5: Checking if route exists...', '#3b82f6')
  
  const targetPath = '/admin/outbound'
  const routeExists = routes.value.some(r => r.path === targetPath)
  
  if (routeExists) {
    log(`Route ${targetPath} EXISTS ✓`, '#22c55e')
  } else {
    log(`Route ${targetPath} NOT FOUND ✗`, '#ef4444')
    log('Available routes:', '#fbbf24')
    routes.value.forEach(r => {
      log(`  - ${r.path}`, '#fbbf24')
    })
  }
}

// Add global error handler
if (process.client) {
  window.addEventListener('error', (event) => {
    log(`Window Error: ${event.message}`, '#ef4444')
    lastError.value = event.message
  })
  
  window.addEventListener('unhandledrejection', (event) => {
    log(`Unhandled Promise Rejection: ${event.reason}`, '#ef4444')
    lastError.value = event.reason
  })
}
</script>