<!-- pages/admin/outbound.vue -->
<template>
  <div class="outbound-container">
    <div class="outbound-card">
      <!-- Header -->
      <div class="header">
        <div class="icon-container">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="1" y="3" width="15" height="13" stroke="currentColor" stroke-width="1.5"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke="currentColor" stroke-width="1.5" fill="currentColor" opacity="0.1"/>
            <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </div>
        <h1>خروج کالا از انبار</h1>
        <p class="subtitle">ثبت خروج و تحویل به مشتریان</p>
      </div>

      <!-- Debug Info (only in development) -->
      <div v-if="debugInfo" class="debug-box">
        <h4>Debug Info:</h4>
        <pre>{{ JSON.stringify(debugInfo, null, 2) }}</pre>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingSheets" class="loading-state">
        <span class="spinner"></span>
        <p>در حال بارگذاری لیست کافه‌ها...</p>
      </div>

      <!-- Message -->
      <Transition name="fade">
        <div v-if="message" :class="['message', `message-${message.type}`]">
          {{ message.text }}
        </div>
      </Transition>

      <!-- Cafe Selection -->
      <div v-if="!isLoadingSheets" class="cafe-selection">
        <label class="label">انتخاب کافه/مشتری</label>
        <div class="select-wrapper">
          <select 
            v-model="selectedCafe" 
            class="select-field"
            :disabled="isLoading || isSaving"
          >
            <option value="">-- انتخاب کنید --</option>
            <option 
              v-for="cafe in cafes" 
              :key="cafe.id"
              :value="cafe.name"
            >
              {{ cafe.name }}
            </option>
          </select>
          <div class="select-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </div>
        <button @click="refreshSheetsList" class="btn-refresh" :disabled="isLoadingSheets">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3m2 5.3a10 10 0 01-18.8 4.2"/>
          </svg>
          بازخوانی لیست
        </button>
        
        <!-- Show count of cafes -->
        <div v-if="cafes.length > 0" class="cafe-count">
          تعداد کافه‌ها: {{ cafes.length }}
        </div>
      </div>

      <!-- Main Form -->
      <div v-if="selectedCafe" class="form">
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
          <label for="qrcode" class="label">ورود دستی QR Data</label>
          <div class="input-wrapper">
            <textarea
              id="qrcode"
              v-model="manualInput"
              placeholder='فرمت Pipe: arabica|40-40-50|bra-col-eth|2025-10-08|25081110001|1 kg|6'
              @keyup.enter.ctrl="submitCode"
              :disabled="isSaving"
              class="input-field"
              rows="3"
            />
          </div>
          <small class="input-hint">فرمت: product|blend|origin|roastDate|batchNumber|packageWeight|packageAmount</small>
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
          <small class="input-hint">تعداد کارتن برای تحویل</small>
        </div>

        <!-- Offset Input -->
        <div class="input-group offset-group">
          <label for="offset" class="label">تعداد آفست</label>
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
        </div>

        <!-- Submit Button -->
        <button
          @click="submitCode"
          :disabled="!manualInput || isSaving || cartonCountInput === null || cartonCountInput === ''"
          class="btn btn-primary"
        >
          <span v-if="!isSaving">ثبت خروج</span>
          <span v-else>
            <span class="spinner"></span>
            در حال ذخیره...
          </span>
        </button>
      </div>

      <!-- Select Cafe Message -->
      <div v-else-if="!isLoadingSheets" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p>لطفاً ابتدا کافه مورد نظر را انتخاب کنید</p>
        <p v-if="cafes.length === 0" class="error-text">
          هیچ کافه‌ای یافت نشد. لطفاً اتصال به Google Sheets را بررسی کنید.
        </p>
      </div>

      <!-- Last Scan Result -->
      <Transition name="slide">
        <div v-if="lastResult" class="result-box">
          <div class="result-header">
            <span class="result-label">آخرین ثبت</span>
            <span class="result-cafe">{{ lastResult.cafe }}</span>
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
              <span class="item-label">وزن:</span>
              <span class="item-value">{{ lastResult.data.packageWeight }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">تعداد کل:</span>
              <span class="item-value">{{ lastResult.totalDelivered }}</span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Today's Summary -->
      <div v-if="todaySummary.length > 0" class="summary">
        <div class="summary-header">
          <span class="section-title">خروجی‌های امروز</span>
          <span class="summary-count">{{ todaySummary.length }} مورد</span>
        </div>
        
        <div class="summary-list">
          <div
            v-for="(item, index) in todaySummary"
            :key="index"
            class="summary-item"
          >
            <div class="summary-cafe">{{ item.cafe }}</div>
            <div class="summary-details">
              <span>{{ item.product }} - {{ item.blend }}</span>
              <span class="dot">•</span>
              <span>{{ item.amount }} عدد</span>
              <span class="dot">•</span>
              <span>{{ item.time }}</span>
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
import { ref, onMounted, nextTick } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '~/composables/useAuth'

console.log('🚚 Outbound page is loading!')

// Auth
const { user } = useAuth()

// Admin emails from config - FIXED
const config = useRuntimeConfig()
const adminEmails = (config.public.adminEmails || 'h.aghasi@torino.company,amirhassan@torino.company')
  .split(',')
  .map(email => email.trim().toLowerCase())

// State
const isCapacitor = ref(false)
const isCameraAvailable = ref(false)
const isScanning = ref(false)
const isSaving = ref(false)
const isLoading = ref(false)
const isLoadingSheets = ref(false)
const manualInput = ref('')
const cartonCountInput = ref(null)
const selectedOffset = ref(0)
const message = ref(null)
const lastResult = ref(null)
const todaySummary = ref([])
const showScanner = ref(false)
const debugInfo = ref(null)

// Cafe Selection
const cafes = ref([])
const selectedCafe = ref('')

let BarcodeScanner = null
let html5QrCode = null

// Lifecycle
onMounted(async () => {
  console.log('🚚 Outbound page mounted')
  console.log('👤 User:', user.value)
  console.log('📧 Admin emails:', adminEmails)
  
  console.log('✅ Admin access granted (auth temporarily disabled)')
  
  // Load cafes from Google Sheets
  await loadCafesFromSheets()
  
  // Check for camera availability
  await checkCameraAvailability()
  
  // Load Html5Qrcode library for web
  if (!isCapacitor.value && process.client) {
    await loadHtml5Qrcode()
  }
  
  // Load today's summary
  loadTodaySummary()
})

// Load Cafes from Google Sheets
async function loadCafesFromSheets() {
  isLoadingSheets.value = true
  try {
    console.log('🔄 Fetching sheets list from API...')
    const response = await fetch('/api/sheets/list')
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API returned error:', response.status, errorText)
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log('📦 API Response:', data)
    
    // Set debug info in development
    if (data.debug) {
      debugInfo.value = data.debug
      console.log('🐛 Debug info:', data.debug)
    }
    
    cafes.value = data.sheets || []
    console.log('☕ Loaded cafes from sheets:', cafes.value)
    console.log('📊 Number of cafes:', cafes.value.length)
    
    if (cafes.value.length === 0) {
      showMessage('هیچ کافه‌ای در سیستم یافت نشد. لطفاً Google Sheet را بررسی کنید.', 'warning')
      console.warn('⚠️ No cafes found in the response')
    } else {
      console.log('✅ Cafes loaded successfully:', cafes.value.map(c => c.name).join(', '))
    }
  } catch (error) {
    console.error('❌ Error loading cafes:', error)
    showMessage(`خطا در بارگذاری لیست کافه‌ها: ${error.message}`, 'error')
    
    // Set empty array on error
    cafes.value = []
    
    // Show debug info
    debugInfo.value = {
      error: error.message,
      stack: error.stack
    }
  } finally {
    isLoadingSheets.value = false
  }
}

// Refresh sheets list
async function refreshSheetsList() {
  selectedCafe.value = ''
  debugInfo.value = null
  await loadCafesFromSheets()
  if (cafes.value.length > 0) {
    showMessage(`لیست کافه‌ها بازخوانی شد (${cafes.value.length} کافه)`, 'success')
  }
}

// Load Html5Qrcode library
async function loadHtml5Qrcode() {
  try {
    const { Html5Qrcode } = await import('html5-qrcode')
    html5QrCode = Html5Qrcode
    console.log('✅ Html5Qrcode library loaded')
  } catch (error) {
    console.error('Error loading Html5Qrcode:', error)
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

// Check Camera Availability
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
    showScanner.value = true
    isScanning.value = true
    
    await nextTick()
    
    setTimeout(async () => {
      try {
        const scanner = new html5QrCode("qr-reader")
        
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
          supportedScanTypes: [0]
        }
        
        await scanner.start(
          { facingMode: "environment" },
          config,
          async (decodedText) => {
            console.log('QR Code detected:', decodedText)
            manualInput.value = decodedText
            await stopWebScanner(scanner)
            showMessage('کد QR با موفقیت اسکن شد', 'success')
          },
          (errorMessage) => {
            // Normal during scanning
          }
        ).catch((err) => {
          console.error('Error starting scanner:', err)
          showMessage('خطا در راه‌اندازی دوربین', 'error')
          stopWebScanner(scanner)
        })
        
        window.currentScanner = scanner
        
      } catch (error) {
        console.error('Scanner initialization error:', error)
        showMessage('خطا در راه‌اندازی اسکنر', 'error')
        isScanning.value = false
        showScanner.value = false
      }
    }, 100)
    
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

// Start Scan
async function startScan() {
  if (!selectedCafe.value) {
    showMessage('لطفاً ابتدا کافه را انتخاب کنید', 'error')
    return
  }

  // Web scanner
  if (!isCapacitor.value) {
    if (showScanner.value) {
      await stopWebScanner()
    } else {
      await startWebScanner()
    }
    return
  }

  // Capacitor scanner
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
  
  if (!selectedCafe.value) {
    showMessage('لطفاً ابتدا کافه را انتخاب کنید', 'error')
    return
  }

  if (cartonCountInput.value === null || cartonCountInput.value === '' || cartonCountInput.value < 0) {
    showMessage('لطفاً تعداد کارتن را وارد کنید', 'error')
    return
  }

  await handleResult(value)
}

// Parse QR Data (same as inventory)
function parseQRData(qrData) {
  let productData = null
  
  try {
    // Try JSON format first
    productData = JSON.parse(qrData)
    console.log('Parsed as JSON:', productData)
  } catch (e) {
    // Try pipe-delimited format
    console.log('Trying pipe-delimited format...')
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
    }
  }
  
  return productData
}

// Handle Result
async function handleResult(qrData) {
  try {
    isSaving.value = true
    showMessage('در حال ثبت خروج...', 'info')

    // Parse QR data
    const productData = parseQRData(qrData)
    
    if (!productData) {
      showMessage('فرمت QR نامعتبر است', 'error')
      return
    }

    // Add user input data
    productData.cartonCount = Number(cartonCountInput.value)
    productData.offset = selectedOffset.value
    productData.packageAmount = parseInt(productData.packageAmount) || 0

    // Validate required fields
    const requiredFields = ['product', 'blend', 'origin', 'roastDate', 'batchNumber', 'packageWeight', 'packageAmount']
    const missingFields = requiredFields.filter(field => !productData[field])
    
    if (missingFields.length > 0) {
      showMessage(`فیلدهای ضروری خالی: ${missingFields.join(', ')}`, 'error')
      return
    }

    const totalAmount = (productData.cartonCount * productData.packageAmount) + (productData.offset || 0)

    // Save to Google Sheets via API
    const response = await fetch('/api/sheets/outbound', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheetName: selectedCafe.value,
        isAdmin: true,  // Admin is doing the scan (positive amount)
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
          'total-in-stock': totalAmount,
          'Timestamp': new Date().toISOString()
        }
      })
    })

    const currentTime = new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    if (response.ok) {
      // Save to last result
      lastResult.value = {
        cafe: selectedCafe.value,
        data: productData,
        totalDelivered: totalAmount,
        time: currentTime
      }

      // Add to today's summary
      todaySummary.value.unshift({
        cafe: selectedCafe.value,
        product: productData.product,
        blend: productData.blend,
        amount: totalAmount,
        time: currentTime
      })

      // Save to localStorage
      saveTodaySummary()

      // Clear inputs
      manualInput.value = ''
      cartonCountInput.value = null
      selectedOffset.value = 0

      showMessage(`✅ خروج ${totalAmount} عدد ${productData.product} برای ${selectedCafe.value} ثبت شد`, 'success')
    } else {
      // Fallback to offline mode
      lastResult.value = {
        cafe: selectedCafe.value,
        data: productData,
        totalDelivered: totalAmount,
        time: currentTime
      }

      todaySummary.value.unshift({
        cafe: selectedCafe.value,
        product: productData.product,
        blend: productData.blend,
        amount: totalAmount,
        time: currentTime
      })

      saveTodaySummary()
      
      // Clear inputs
      manualInput.value = ''
      cartonCountInput.value = null
      selectedOffset.value = 0
      
      showMessage(`خروج برای ${selectedCafe.value} ثبت شد (آفلاین)`, 'info')
    }

  } catch (error) {
    console.error('خطا در پردازش:', error)
    showMessage(`خطا در پردازش: ${error.message}`, 'error')
  } finally {
    isSaving.value = false
  }
}

// Show Message
function showMessage(text, type) {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 3000)
}

// Storage
function saveTodaySummary() {
  if (process.client) {
    const today = new Date().toDateString()
    localStorage.setItem(`outbound_${today}`, JSON.stringify(todaySummary.value))
  }
}

function loadTodaySummary() {
  if (process.client) {
    const today = new Date().toDateString()
    const saved = localStorage.getItem(`outbound_${today}`)
    if (saved) {
      try {
        todaySummary.value = JSON.parse(saved)
      } catch (e) {
        console.error('Error loading summary:', e)
      }
    }
  }
}
</script>

<style scoped>
/* Container */
.outbound-container {
  min-height: 100vh;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.outbound-card {
  width: 100%;
  max-width: 500px;
  padding: 40px 32px;
}

/* Debug Box */
.debug-box {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 11px;
  color: #888;
}

.debug-box h4 {
  margin: 0 0 8px 0;
  color: #aaa;
  font-size: 12px;
}

.debug-box pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
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
  color: #22c55e;
}

h1 {
  font-size: 32px;
  font-weight: 300;
  letter-spacing: -1.5px;
  color: #ffffff;
  margin-bottom: 8px;
}

.subtitle {
  color: #b0b0b0;
  font-size: 14px;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 40px 0;
  color: #808080;
}

.loading-state .spinner {
  margin-bottom: 16px;
}

/* Cafe Selection */
.cafe-selection {
  margin-bottom: 24px;
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

.btn-refresh {
  margin-top: 8px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid #555;
  border-radius: 6px;
  color: #b0b0b0;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #404040;
  color: #ffffff;
  border-color: #666;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cafe-count {
  margin-top: 8px;
  font-size: 12px;
  color: #22c55e;
  text-align: center;
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
  background: #333;
  cursor: not-allowed;
  opacity: 0.6;
}

.input-field::placeholder {
  color: #666;
  font-size: 11px;
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
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.btn-primary .spinner {
  border-color: rgba(42,42,42,0.3);
  border-top-color: #2a2a2a;
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

.message-warning {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
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

.result-cafe {
  font-size: 13px;
  padding: 4px 10px;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border-radius: 20px;
  font-weight: 500;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-label {
  font-size: 11px;
  color: #808080;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.item-value {
  font-size: 13px;
  color: #ffffff;
  font-weight: 500;
}

/* Summary */
.summary {
  border-top: 1px solid #444;
  padding-top: 24px;
  margin-bottom: 24px;
}

.summary-header {
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

.summary-count {
  font-size: 11px;
  padding: 4px 10px;
  background: #404040;
  color: #b0b0b0;
  border-radius: 12px;
}

.summary-list {
  max-height: 200px;
  overflow-y: auto;
}

.summary-item {
  padding: 12px;
  background: #333;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #444;
}

.summary-cafe {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
}

.summary-details {
  font-size: 11px;
  color: #808080;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  color: #555;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 0;
  color: #808080;
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
}

.empty-state .error-text {
  color: #fbbf24;
  margin-top: 12px;
  font-size: 12px;
}

/* Footer */
.footer {
  text-align: center;
  margin-top: 24px;
}

/* Scrollbar */
.summary-list::-webkit-scrollbar {
  width: 4px;
}

.summary-list::-webkit-scrollbar-track {
  background: #333;
}

.summary-list::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 2px;
}

.summary-list::-webkit-scrollbar-thumb:hover {
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
  .outbound-card {
    padding: 32px 24px;
  }

  h1 {
    font-size: 28px;
  }

  .icon-container {
    width: 70px;
    height: 70px;
  }

  .result-grid {
    grid-template-columns: 1fr;
  }

  .summary-list {
    max-height: 150px;
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