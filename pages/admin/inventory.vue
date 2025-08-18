<!-- pages/admin/inventory.vue -->
<template>
  <div class="inventory-container">
    <div class="inventory-card">
      <!-- Header -->
      <div class="header">
        <div class="icon-container">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" 
                  stroke="currentColor" stroke-width="1.5"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="currentColor" stroke-width="1.5"/>
            <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </div>
        <h1>موجودی انبار</h1>
        <p class="subtitle">ثبت و مدیریت موجودی محصولات</p>
      </div>

      <!-- Message -->
      <Transition name="fade">
        <div v-if="message" :class="['message', `message-${message.type}`]">
          {{ message.text }}
        </div>
      </Transition>

      <!-- Current Stats -->
      <div class="stats-section">
        <div class="stat-box">
          <span class="stat-label">کل محصولات</span>
          <span class="stat-value">{{ totalProducts }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">آخرین ثبت</span>
          <span class="stat-value">{{ lastScanTime || '--:--' }}</span>
        </div>
      </div>

      <!-- Main Form -->
      <div class="form">
        <!-- Camera Button (works for both Capacitor and Web) -->
        <button
          v-if="isCameraAvailable"
          @click="startScan"
          :disabled="isScanning || isSaving"
          class="btn btn-primary btn-camera"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span v-if="!isScanning && !isSaving">اسکن QR محصول</span>
          <span v-else-if="isScanning">
            <span class="spinner"></span>
            در حال اسکن...
          </span>
          <span v-else>
            <span class="spinner"></span>
            در حال ذخیره...
          </span>
        </button>

        <!-- QR Scanner Video Container (for Web) -->
        <div v-show="!isCapacitor && showScanner" id="qr-reader" style="width: 100%; max-width: 400px; margin: 0 auto 20px;"></div>
        
        <!-- Stop Scanner Button (shown when scanning) -->
        <button
          v-if="!isCapacitor && showScanner"
          @click="stopWebScanner()"
          class="btn btn-outline"
          style="margin-bottom: 20px;"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="16" height="16"/>
          </svg>
          توقف اسکن
        </button>

        <div v-if="isCameraAvailable" class="divider">
          <span>یا</span>
        </div>

        <!-- Manual Input -->
        <div class="input-group">
          <label for="qrcode" class="label">ورود دستی اطلاعات محصول (JSON یا Pipe-delimited)</label>
          <div class="input-wrapper">
            <textarea
              id="qrcode"
              v-model="manualInput"
              placeholder='JSON: {"product":"Coffee","blend":"Arabica 100%",...}
یا
Pipe: arabica|40-40-50|bra-col-eth|2025-10-08|25081110001|1 kg|6'
              @keyup.enter.ctrl="submitCode"
              :disabled="isSaving"
              class="input-field"
              rows="4"
            />
          </div>
          <small class="input-hint">فیلدهای ضروری: product, blend, origin, roastDate, batchNumber, packageWeight, packageAmount</small>
        </div>

        <!-- Carton Count Input -->
        <div class="input-group">
          <label for="cartonCount" class="label">تعداد کارتن</label>
          <div class="input-wrapper">
            <input
              id="cartonCount"
              v-model.number="cartonCountInput"
              type="number"
              min="0"
              placeholder="مثال: 5"
              :disabled="isSaving"
              class="input-field number-input"
            />
          </div>
          <small class="input-hint">تعداد کارتن‌های موجود را وارد کنید (فقط عدد)</small>
        </div>

        <!-- Offset Dropdown -->
        <div class="input-group offset-group">
          <label for="offset" class="label">تعداد آفست (خارج از کارتن)</label>
          <div class="select-wrapper">
            <select 
              id="offset"
              v-model="selectedOffset" 
              class="select-field"
              :disabled="isSaving"
            >
              <option :value="0">بدون آفست</option>
              <option :value="1">1 عدد</option>
              <option :value="2">2 عدد</option>
              <option :value="3">3 عدد</option>
              <option :value="4">4 عدد</option>
              <option :value="5">5 عدد</option>
            </select>
            <div class="select-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>
          <small class="input-hint">تعداد بسته‌های خارج از کارتن (حداکثر 5)</small>
        </div>

        <!-- Submit Button -->
        <button
          @click="submitCode"
          :disabled="!manualInput || isSaving || cartonCountInput === null || cartonCountInput === ''"
          class="btn btn-primary"
        >
          <span v-if="!isSaving">ثبت در انبار</span>
          <span v-else>
            <span class="spinner"></span>
            در حال ذخیره...
          </span>
        </button>
      </div>

      <!-- Last Scan Result -->
      <Transition name="slide">
        <div v-if="lastResult" class="result-box">
          <div class="result-header">
            <span class="result-label">آخرین محصول ثبت شده</span>
            <span class="result-time">{{ lastResult.time }}</span>
          </div>
          <div class="result-grid">
            <div class="result-item">
              <span class="item-label">محصول:</span>
              <span class="item-value">{{ lastResult.data.product }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">ترکیب:</span>
              <span class="item-value">{{ lastResult.data.blend }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">منشأ:</span>
              <span class="item-value">{{ lastResult.data.origin }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">تاریخ رست:</span>
              <span class="item-value">{{ lastResult.data.roastDate }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">شماره بچ:</span>
              <span class="item-value">{{ lastResult.data.batchNumber }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">وزن بسته:</span>
              <span class="item-value">{{ lastResult.data.packageWeight }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">تعداد در کارتن:</span>
              <span class="item-value">{{ lastResult.data.packageAmount }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">تعداد کارتن:</span>
              <span class="item-value">{{ lastResult.data.cartonCount }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">آفست:</span>
              <span class="item-value">{{ lastResult.data.offset || 0 }}</span>
            </div>
            <div class="result-item total-row">
              <span class="item-label">مجموع در انبار:</span>
              <span class="item-value total-value">{{ lastResult.totalInStock }}</span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Today's Inventory -->
      <div v-if="todayInventory.length > 0" class="inventory-list">
        <div class="list-header">
          <span class="section-title">ثبت‌های امروز</span>
          <span class="list-count">{{ todayInventory.length }} مورد</span>
        </div>
        
        <div class="list-container">
          <div
            v-for="(item, index) in todayInventory"
            :key="index"
            class="inventory-item"
          >
            <div class="item-header">
              <span class="item-product">{{ item.product }} - {{ item.blend }}</span>
              <span class="item-time">{{ item.time }}</span>
            </div>
            <div class="item-details">
              <span>{{ item.origin }}</span>
              <span class="dot">•</span>
              <span>{{ item.cartonCount }} کارتن</span>
              <span class="dot">•</span>
              <span>{{ item.packageAmount }} در کارتن</span>
              <span v-if="item.offset" class="dot">•</span>
              <span v-if="item.offset">+{{ item.offset }} آفست</span>
              <span class="dot">•</span>
              <span class="total-badge">مجموع: {{ item.totalInStock }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <NuxtLink to="/admin/admin-index" class="btn btn-outline">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          بازگشت به داشبورد
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, nextTick } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '~/composables/useAuth'

console.log('📦 Inventory page is loading!')

// Auth
const { user } = useAuth()

// Admin email from config
const config = useRuntimeConfig()
const adminEmail = config.public.firstAdminEmail || ''

// State
const isCapacitor = ref(false)
const isCameraAvailable = ref(false)
const isScanning = ref(false)
const isSaving = ref(false)
const manualInput = ref('')
const cartonCountInput = ref(null)
const selectedOffset = ref(0)
const message = ref(null)
const lastResult = ref(null)
const todayInventory = ref([])
const lastScanTime = ref(null)
const showScanner = ref(false)

let BarcodeScanner = null
let html5QrCode = null

// Computed
const totalProducts = computed(() => {
  return todayInventory.value.reduce((sum, item) => {
    return sum + (item.totalInStock || 0)
  }, 0)
})

// Lifecycle
onMounted(async () => {
  console.log('📦 Inventory page mounted')
  console.log('👤 User:', user.value)
  console.log('📧 Admin email:', adminEmail)
  
  console.log('✅ Admin access granted (auth temporarily disabled)')
  
  // Check for camera availability
  await checkCameraAvailability()
  
  // Load Html5Qrcode library for web
  if (!isCapacitor.value && process.client) {
    await loadHtml5Qrcode()
  }
  
  // Load today's inventory
  loadTodayInventory()
})

onUnmounted(() => {
  // Clean up scanner if active
  if (html5QrCode) {
    stopWebScanner()
  }
})

// Load Html5Qrcode library
async function loadHtml5Qrcode() {
  try {
    // Dynamically import html5-qrcode
    const { Html5Qrcode } = await import('html5-qrcode')
    html5QrCode = Html5Qrcode
    console.log('✅ Html5Qrcode library loaded')
  } catch (error) {
    console.error('Error loading Html5Qrcode:', error)
    // Try loading from CDN as fallback
    if (typeof window !== 'undefined' && !window.Html5Qrcode) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
      script.onload = () => {
        html5QrCode = window.Html5Qrcode
        console.log('✅ Html5Qrcode loaded from CDN')
      }
      document.head.appendChild(script)
    }
  }
}

// Check Camera Availability (both Capacitor and Web)
async function checkCameraAvailability() {
  if (Capacitor.isNativePlatform()) {
    console.log('📱 Native platform detected')
    isCapacitor.value = true
    await checkCapacitorCamera()
  } else {
    console.log('🌐 Web platform detected')
    isCapacitor.value = false
    await checkWebCamera()
  }
}

// Check Capacitor Camera
async function checkCapacitorCamera() {
  try {
    const module = await import('@capacitor-mlkit/barcode-scanning')
    BarcodeScanner = module.BarcodeScanner
    
    const { supported } = await BarcodeScanner.isSupported()
    if (supported) {
      isCameraAvailable.value = true
      console.log('✅ Capacitor camera available')
    }
  } catch (error) {
    console.error('خطا در بارگذاری BarcodeScanner:', error)
    isCameraAvailable.value = false
  }
}

// Check Web Camera
async function checkWebCamera() {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      isCameraAvailable.value = true
      console.log('✅ Web camera API available')
    } else {
      isCameraAvailable.value = false
      console.log('❌ Camera API not supported')
    }
  } catch (error) {
    console.error('Error checking web camera:', error)
    isCameraAvailable.value = false
  }
}

// Start Web Scanner
async function startWebScanner() {
  if (!html5QrCode) {
    showMessage('کتابخانه اسکنر در حال بارگذاری است...', 'info')
    setTimeout(() => startWebScanner(), 1000)
    return
  }

  try {
    // First show the scanner container
    showScanner.value = true
    isScanning.value = true
    
    // Wait for DOM to update
    await nextTick()
    
    // Add a small delay to ensure element is in DOM
    setTimeout(async () => {
      try {
        const scanner = new html5QrCode("qr-reader")
        
        // Configuration for scanner
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          // Add more options for better mobile support
          rememberLastUsedCamera: true,
          supportedScanTypes: [0] // 0 = camera
        }
        
        // Start scanning
        await scanner.start(
          { facingMode: "environment" }, // Use back camera
          config,
          async (decodedText) => {
            // QR Code detected
            console.log('QR Code detected:', decodedText)
            manualInput.value = decodedText
            await stopWebScanner(scanner)
            showMessage('کد QR با موفقیت اسکن شد', 'success')
          },
          (errorMessage) => {
            // No QR code detected
            // This is normal during scanning, no action needed
          }
        ).catch((err) => {
          console.error('Error starting scanner:', err)
          showMessage('خطا در راه‌اندازی دوربین', 'error')
          stopWebScanner(scanner)
        })
        
        // Store scanner instance for cleanup
        window.currentScanner = scanner
        
      } catch (error) {
        console.error('Scanner initialization error:', error)
        showMessage('خطا در راه‌اندازی اسکنر', 'error')
        isScanning.value = false
        showScanner.value = false
      }
    }, 100) // Small delay to ensure DOM is ready
    
  } catch (error) {
    console.error('Scanner error:', error)
    showMessage('خطا در اسکن QR', 'error')
    isScanning.value = false
    showScanner.value = false
  }
}

// Stop Web Scanner
async function stopWebScanner(scanner = null) {
  try {
    const activeScanner = scanner || window.currentScanner
    if (activeScanner) {
      await activeScanner.stop()
      activeScanner.clear()
      window.currentScanner = null
    }
  } catch (error) {
    console.error('Error stopping scanner:', error)
  } finally {
    isScanning.value = false
    showScanner.value = false
  }
}

// Start Scan (Updated)
async function startScan() {
  // If it's web platform, use Html5Qrcode
  if (!isCapacitor.value) {
    if (showScanner.value) {
      // Stop scanner if already running
      await stopWebScanner()
    } else {
      // Start scanner
      await startWebScanner()
    }
    return
  }

  // Original Capacitor logic
  if (!BarcodeScanner || isScanning.value) return

  try {
    isScanning.value = true

    const { camera } = await BarcodeScanner.requestPermissions()
    
    if (camera !== 'granted' && camera !== 'limited') {
      showMessage('دسترسی به دوربین رد شد', 'error')
      return
    }

    const scanResult = await BarcodeScanner.scan({
      formats: []
    })

    if (scanResult?.barcodes?.length > 0) {
      const qrData = scanResult.barcodes[0].rawValue || scanResult.barcodes[0].displayValue
      manualInput.value = qrData
      showMessage('کد QR با موفقیت اسکن شد', 'success')
    } else {
      showMessage('کدی شناسایی نشد', 'info')
    }
  } catch (error) {
    showMessage(`خطا در اسکن: ${error.message}`, 'error')
  } finally {
    isScanning.value = false
  }
}

// Submit Manual Code
async function submitCode() {
  const value = manualInput.value.trim()
  if (!value) return

  if (cartonCountInput.value === null || cartonCountInput.value === '' || cartonCountInput.value < 0) {
    showMessage('لطفاً تعداد کارتن را وارد کنید', 'error')
    return
  }

  await handleResult(value)
}

// Handle Result - FIXED to handle both JSON and pipe-delimited formats
async function handleResult(qrData) {
  try {
    isSaving.value = true
    showMessage('در حال ثبت در انبار...', 'info')

    // Parse QR data - handle both JSON and pipe-delimited formats
    let productData
    try {
      // First try to parse as JSON
      productData = JSON.parse(qrData)
      console.log('Parsed as JSON:', productData)
    } catch (e) {
      // If not JSON, try to parse as pipe-delimited format
      console.log('Not JSON format, trying pipe-delimited format...')
      
      // Expected format: product|blend|origin|roastDate|batchNumber|packageWeight|packageAmount
      const parts = qrData.split('|')
      
      if (parts.length >= 7) {
        productData = {
          product: parts[0] || '',
          blend: parts[1] || '',
          origin: parts[2] || '',
          roastDate: parts[3] || '',
          batchNumber: parts[4] || '',
          packageWeight: parts[5] || '',
          packageAmount: parseInt(parts[6]) || 0
        }
        
        console.log('Parsed pipe-delimited data:', productData)
      } else {
        showMessage('فرمت QR نامعتبر است (نه JSON و نه pipe-delimited)', 'error')
        return
      }
    }

    // Add carton count and offset from user input
    productData.cartonCount = Number(cartonCountInput.value)
    productData.offset = selectedOffset.value

    // Validate required fields
    const requiredFields = ['product', 'blend', 'origin', 'roastDate', 'batchNumber', 'packageWeight', 'packageAmount']
    const missingFields = requiredFields.filter(field => !productData[field])
    
    if (missingFields.length > 0) {
      showMessage(`فیلدهای ضروری خالی هستند: ${missingFields.join(', ')}`, 'error')
      return
    }

    if (!productData.cartonCount || productData.cartonCount < 0) {
      showMessage('تعداد کارتن نامعتبر است', 'error')
      return
    }

    // Ensure packageAmount is a number
    productData.packageAmount = parseInt(productData.packageAmount) || 0
    
    const totalInStock = (productData.cartonCount * productData.packageAmount) + (productData.offset || 0)

    // Save to Google Sheets via API
    const response = await fetch('/api/sheets/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheetName: 'real-time inventory',
        data: {
          'Product': productData.product,
          'Blend': productData.blend,
          'Origin': productData.origin,
          'Roast-Date': productData.roastDate,
          'Batch-Number': productData.batchNumber,
          'Package-Weight': productData.packageWeight,
          'Package-Amount': productData.packageAmount,
          'cartoncount': productData.cartonCount,
          'offset': productData.offset || 0,
          'total in stock': totalInStock,
          'Timestamp': new Date().toISOString()
        }
      })
    })

    if (response.ok) {
      const currentTime = new Date().toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit'
      })

      lastResult.value = {
        data: productData,
        time: currentTime,
        totalInStock: totalInStock
      }

      lastScanTime.value = currentTime

      todayInventory.value.unshift({
        ...productData,
        totalInStock: totalInStock,
        time: currentTime
      })

      saveTodayInventory()

      // Clear inputs after successful save
      cartonCountInput.value = null
      selectedOffset.value = 0
      manualInput.value = ''

      showMessage(`محصول ${productData.product} با ${totalInStock} عدد در انبار ثبت شد`, 'success')
    } else {
      const error = await response.text()
      showMessage(`خطا در ثبت: ${error}`, 'error')
    }

  } catch (error) {
    console.error('خطا در پردازش:', error)
    
    // Fallback to offline mode
    const currentTime = new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    let productData
    try {
      // Try JSON first
      productData = JSON.parse(qrData)
    } catch (e) {
      // Try pipe-delimited
      const parts = qrData.split('|')
      if (parts.length >= 7) {
        productData = {
          product: parts[0] || '',
          blend: parts[1] || '',
          origin: parts[2] || '',
          roastDate: parts[3] || '',
          batchNumber: parts[4] || '',
          packageWeight: parts[5] || '',
          packageAmount: parseInt(parts[6]) || 0
        }
      } else {
        showMessage('فرمت داده نامعتبر', 'error')
        return
      }
    }
    
    productData.cartonCount = Number(cartonCountInput.value)
    productData.offset = selectedOffset.value
    productData.packageAmount = parseInt(productData.packageAmount) || 0

    const totalInStock = (productData.cartonCount * productData.packageAmount) + (productData.offset || 0)

    lastResult.value = {
      data: productData,
      time: currentTime,
      totalInStock: totalInStock
    }

    lastScanTime.value = currentTime

    todayInventory.value.unshift({
      ...productData,
      totalInStock: totalInStock,
      time: currentTime
    })

    saveTodayInventory()
    
    // Clear inputs
    cartonCountInput.value = null
    selectedOffset.value = 0
    manualInput.value = ''
    
    showMessage(`محصول با ${totalInStock} عدد ثبت شد (حالت آفلاین)`, 'info')
  } finally {
    isSaving.value = false
  }
}

// Clear Input
function clearInput() {
  manualInput.value = ''
}

// Show Message
function showMessage(text, type) {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 3000)
}

// Storage
function saveTodayInventory() {
  if (typeof window !== 'undefined') {
    const today = new Date().toDateString()
    localStorage.setItem(`inventory_${today}`, JSON.stringify(todayInventory.value))
  }
}

function loadTodayInventory() {
  if (typeof window !== 'undefined') {
    const today = new Date().toDateString()
    const saved = localStorage.getItem(`inventory_${today}`)
    if (saved) {
      try {
        todayInventory.value = JSON.parse(saved)
        if (todayInventory.value.length > 0) {
          lastScanTime.value = todayInventory.value[0].time
        }
      } catch (e) {
        console.error('Error loading inventory:', e)
      }
    }
  }
}
</script>

<style scoped>
/* Container - Dark Theme */
.inventory-container {
  min-height: 100vh;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.inventory-card {
  width: 100%;
  max-width: 500px;
  padding: 40px 32px;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 32px;
}

.icon-container {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  border-radius: 50%;
  border: 2px solid #555;
  color: #3b82f6;
}

h1 {
  font-size: 32px;
  font-weight: 300;
  letter-spacing: -1.5px;
  margin-bottom: 8px;
  color: #ffffff;
}

.subtitle {
  color: #b0b0b0;
  font-size: 14px;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 32px;
}

.stat-box {
  background: #333;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid #444;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #808080;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 300;
  color: #ffffff;
}

/* Form */
.form {
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-group {
  width: 100%;
  margin-bottom: 16px;
}

.offset-group {
  max-width: 280px;
}

.label {
  display: block;
  font-size: 12px;
  color: #b0b0b0;
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}

.input-wrapper {
  position: relative;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #555;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
  background: #404040;
  color: #ffffff;
  font-family: 'SF Mono', Monaco, monospace;
  resize: vertical;
}

.number-input {
  text-align: center;
  max-width: 280px;
  margin: 0 auto;
  display: block;
  font-size: 16px;
  font-weight: 500;
}

/* Remove number input arrows for cleaner look */
.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}

.input-field:focus {
  outline: none;
  border-color: #888;
  background: #484848;
}

.input-field:disabled {
  background: #2a2a2a;
  cursor: not-allowed;
  opacity: 0.6;
}

.input-field::placeholder {
  color: #666;
  font-size: 11px;
  white-space: pre-line;
}

/* Select Dropdown */
.select-wrapper {
  position: relative;
}

.select-field {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 1px solid #555;
  border-radius: 8px;
  font-size: 14px;
  background: #404040;
  color: #ffffff;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s;
}

.select-field:focus {
  outline: none;
  border-color: #888;
  background: #484848;
}

.select-field:disabled {
  background: #333;
  cursor: not-allowed;
  opacity: 0.6;
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #808080;
}

.input-hint {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: #808080;
  text-align: center;
}

/* Buttons */
.btn {
  width: 100%;
  max-width: 280px;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: #ffffff;
  color: #2a2a2a;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255,255,255,0.15);
  background: #f0f0f0;
}

.btn-primary:disabled {
  background: #555;
  color: #999;
  cursor: not-allowed;
}

.btn-camera {
  margin-bottom: 20px;
}

.btn-outline {
  background: transparent;
  color: #b0b0b0;
  border: 1px solid #555;
  text-decoration: none;
}

.btn-outline:hover {
  background: #404040;
  color: #ffffff;
  border-color: #666;
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(42,42,42,0.3);
  border-top-color: #2a2a2a;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Divider */
.divider {
  position: relative;
  text-align: center;
  margin: 24px 0;
  width: 100%;
  max-width: 280px;
}

.divider::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: #555;
}

.divider span {
  position: relative;
  background: #2a2a2a;
  padding: 0 16px;
  color: #808080;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Message */
.message {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
  max-width: 100%;
}

.message-success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.message-error {
  background: rgba(239, 68, 68, 0.1);
  color: #ff6b6b;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.message-info {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Result Box */
.result-box {
  background: #333;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #444;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #444;
}

.result-label {
  font-size: 12px;
  color: #b0b0b0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-time {
  font-size: 14px;
  color: #22c55e;
}

.result-grid {
  display: grid;
  gap: 12px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #3a3a3a;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item.total-row {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 2px solid #444;
  border-bottom: none;
}

.item-label {
  font-size: 12px;
  color: #808080;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.item-value {
  font-size: 14px;
  color: #ffffff;
  font-weight: 500;
}

.total-value {
  font-size: 18px;
  color: #22c55e;
  font-weight: 700;
}

/* Inventory List */
.inventory-list {
  border-top: 1px solid #444;
  padding-top: 24px;
  margin-bottom: 24px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #b0b0b0;
}

.list-count {
  font-size: 11px;
  padding: 4px 10px;
  background: #404040;
  color: #b0b0b0;
  border-radius: 12px;
}

.list-container {
  max-height: 400px;
  overflow-y: auto;
}

.inventory-item {
  padding: 14px;
  background: #333;
  border-radius: 8px;
  margin-bottom: 10px;
  border: 1px solid #444;
  transition: all 0.2s;
}

.inventory-item:hover {
  background: #3a3a3a;
  border-color: #555;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-product {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.item-time {
  font-size: 11px;
  color: #22c55e;
}

.item-details {
  font-size: 12px;
  color: #808080;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.dot {
  color: #555;
}

.total-badge {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

/* Footer */
.footer {
  text-align: center;
  margin-top: 24px;
}

/* Scrollbar */
.list-container::-webkit-scrollbar {
  width: 4px;
}

.list-container::-webkit-scrollbar-track {
  background: #2a2a2a;
}

.list-container::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 2px;
}

.list-container::-webkit-scrollbar-thumb:hover {
  background: #666;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Mobile */
@media (max-width: 480px) {
  .inventory-card {
    padding: 32px 24px;
  }

  h1 {
    font-size: 28px;
  }

  .icon-container {
    width: 70px;
    height: 70px;
  }

  .stats-section {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .list-container {
    max-height: 200px;
  }

  .btn {
    padding: 10px 16px;
    font-size: 13px;
  }
}

/* RTL Support */
[dir="rtl"] .select-icon {
  right: auto;
  left: 12px;
}

[dir="rtl"] .select-field {
  padding: 12px 16px 12px 40px;
}
</style>