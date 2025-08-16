<!-- pages/test-admin.vue -->
<template>
  <div style="padding: 50px; background: #2a2a2a; min-height: 100vh; color: white;">
    <h1>تست Navigation در Admin</h1>
    
    <div style="margin: 20px 0;">
      <p>Current Path: {{ currentPath }}</p>
      <p>User Email: {{ userEmail }}</p>
      <p>Admin Email from Config: {{ adminEmail }}</p>
      <p>Is Admin: {{ isAdmin }}</p>
    </div>

    <div style="display: grid; gap: 10px; max-width: 400px;">
      <!-- تست 1: navigateTo معمولی -->
      <button @click="test1" style="padding: 15px; background: #333; color: white; border: 1px solid #555;">
        Test 1: navigateTo('/admin/outbound')
      </button>
      
      <!-- تست 2: navigateTo با await -->
      <button @click="test2" style="padding: 15px; background: #333; color: white; border: 1px solid #555;">
        Test 2: await navigateTo('/admin/outbound')
      </button>
      
      <!-- تست 3: router.push -->
      <button @click="test3" style="padding: 15px; background: #333; color: white; border: 1px solid #555;">
        Test 3: router.push('/admin/outbound')
      </button>
      
      <!-- تست 4: window.location -->
      <button @click="test4" style="padding: 15px; background: #333; color: white; border: 1px solid #555;">
        Test 4: window.location.href
      </button>
      
      <!-- تست 5: NuxtLink -->
      <NuxtLink to="/admin/outbound" style="padding: 15px; background: #333; color: white; border: 1px solid #555; text-decoration: none; display: block; text-align: center;">
        Test 5: NuxtLink to="/admin/outbound"
      </NuxtLink>
      
      <!-- تست 6: a tag معمولی -->
      <a href="/admin/outbound" style="padding: 15px; background: #333; color: white; border: 1px solid #555; text-decoration: none; display: block; text-align: center;">
        Test 6: Regular &lt;a&gt; tag
      </a>
    </div>

    <!-- Console Output -->
    <div style="margin-top: 30px; padding: 20px; background: #000; border: 1px solid #555; font-family: monospace; white-space: pre-wrap;">
      <h3>Console Output:</h3>
      <div v-for="(log, index) in consoleLogs" :key="index">
        {{ log }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { navigateTo, useRouter, useRoute } from '#app'
import { useAuth } from '~/composables/useAuth'

// Router & Route
const router = useRouter()
const route = useRoute()

// Auth
const { user } = useAuth()

// Config
const config = useRuntimeConfig()
const adminEmail = ref(config.public.firstAdminEmail || 'not-set')

// State
const currentPath = ref('')
const userEmail = ref('')
const isAdmin = ref(false)
const consoleLogs = ref([])

// Helper function to log
function log(message) {
  const timestamp = new Date().toLocaleTimeString()
  const logMessage = `[${timestamp}] ${message}`
  console.log(logMessage)
  consoleLogs.value.push(logMessage)
}

// Lifecycle
onMounted(() => {
  currentPath.value = route.path
  userEmail.value = user.value?.email || 'not-logged-in'
  isAdmin.value = user.value?.email === adminEmail.value
  
  log('Page mounted')
  log(`Current path: ${currentPath.value}`)
  log(`User email: ${userEmail.value}`)
  log(`Admin email: ${adminEmail.value}`)
  log(`Is admin: ${isAdmin.value}`)
})

// Test Functions
function test1() {
  log('Test 1: Starting navigateTo...')
  try {
    navigateTo('/admin/outbound')
    log('Test 1: navigateTo called successfully')
  } catch (error) {
    log(`Test 1: Error - ${error.message}`)
  }
}

async function test2() {
  log('Test 2: Starting await navigateTo...')
  try {
    await navigateTo('/admin/outbound')
    log('Test 2: Navigation completed')
  } catch (error) {
    log(`Test 2: Error - ${error.message}`)
  }
}

async function test3() {
  log('Test 3: Starting router.push...')
  try {
    await router.push('/admin/outbound')
    log('Test 3: Router push completed')
  } catch (error) {
    log(`Test 3: Error - ${error.message}`)
  }
}

function test4() {
  log('Test 4: Using window.location.href...')
  window.location.href = '/admin/outbound'
}
</script>