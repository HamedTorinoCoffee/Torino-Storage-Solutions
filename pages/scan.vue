<!-- pages/scan.vue -->
<template>
  <div class="scanner-container">
    <div class="scanner-card">
      <!-- Header -->
      <div class="header">
        <div class="icon-container">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <line x1="7" y1="7" x2="7" y2="17" stroke="currentColor" stroke-width="1.5"/>
            <line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" stroke-width="1.5"/>
            <line x1="17" y1="7" x2="17" y2="17" stroke="currentColor" stroke-width="0.5"/>
          </svg>
        </div>
        <h1>اسکن محصول</h1>
        <p class="subtitle">{{ cafeName ? `کافه ${cafeName}` : 'اسکن QR کد محصول' }}</p>
      </div>

      <!-- Message -->
      <Transition name="fade">
        <div v-if="message" :class="['message', `message-${message.type}`]">
          {{ message.text }}
        </div>
      </Transition>

      <!-- Main Form -->
      <div class="form">
        <!-- Camera Button (Capacitor) -->
        <button
          v-if="isCapacitor"
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

        <!-- Web Camera Button -->
        <button
          v-if="!isCapacitor && isCameraSupported"
          @click="startWebCameraScan"
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

        <!-- Info Message -->
        <div class="info-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <p>هر اسکن = خروج 1 کارتن (6 بسته)</p>
        </div>
      </div>

      <!-- Web Camera Video -->
      <Transition name="slide">
        <div v-if="showWebCamera" class="camera-container">
          <div class="camera-header">
            <span>دوربین فعال</span>
            <button @click="stopWebCamera" class="close-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <video
            ref="videoRef"
            autoplay
            playsinline
            class="camera-video"
          ></video>
          <div class="camera-overlay">
            <div class="scan-frame"></div>
            <p>کد QR محصول را در کادر قرار دهید</p>
          </div>
        </div>
      </Transition>

      <!-- Last Result Box -->
      <Transition name="slide">
        <div v-if="lastResult" class="result-box">
          <div class="result-header">
            <span class="result-label">آخرین ثبت</span>
            <span class="result-type">خروج 6 بسته</span>
          </div>
          <div class="result-grid">
            <div class="result-item">
              <span class="item-label">محصول:</span>
              <span class="item-value">{{ lastResult.product }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">ترکیب:</span>
              <span class="item-value">{{ lastResult.blend }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">منشأ:</span>
              <span class="item-value">{{ lastResult.origin }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">تاریخ رست:</span>
              <span class="item-value">{{ lastResult.roastDate }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">شماره بچ:</span>
              <span class="item-value">{{ lastResult.batchNumber }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">تعداد خروجی:</span>
              <span class="item-value">6 بسته (1 کارتن)</span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- History Section -->
      <div v-if="history.length > 0" class="history">
        <div class="history-header">
          <span class="section-title">تاریخچه امروز</span>
          <span class="history-count">{{ history.length }} مورد</span>
        </div>
        
        <div class="history-list">
          <TransitionGroup name="list">
            <div
              v-for="item in history"
              :key="item.id"
              :class="['history-item', { 'not-synced': !item.synced }]"
            >
              <div class="history-main">
                <span class="history-product">{{ item.product }} - {{ item.blend }}</span>
                <span class="history-amount">6 بسته</span>
              </div>
              <div class="history-meta">
                <span>{{ item.time }}</span>
                <span v-if="!item.synced" class="sync-indicator">⚠ آفلاین</span>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
        </svg>
        <p>هنوز اسکنی انجام نشده</p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <NuxtLink to="/" class="btn btn-outline">
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
import { useWebCamera } from '~/composables/useWebCamera'

// Auth & User info
const { user } = useAuth()
const cafeName = ref('')

// Web camera support
const webCamera = useWebCamera()

// State
const isCapacitor = ref(false)
const isCameraSupported = ref(false)
const isScanning = ref(false)
const isSaving = ref(false)
const lastResult = ref(null)
const message = ref(null)
const history = ref([])
const showWebCamera = ref(false)

// Refs
const videoRef = ref()

let BarcodeScanner = null

// Constants
const PACKAGES_PER_CARTON = 6  // Each scan = 1 carton = 6 packages

// Lifecycle
onMounted(async () => {
  console.log('📷 Scan page mounted')
  console.log('👤 User:', user.value)
  
  // Get cafe name from user email and convert dots to underscores
  if (user.value?.email) {
    // Extract cafe name from email and replace dots with underscores
    // e.g., "r.hazrati@example.com" -> "r_hazrati"
    cafeName.value = user.value.email.split('@')[0].replace(/\./g, '_')
    console.log('📝 Cafe sheet name:', cafeName.value)
  }
  
  loadHistory()
  await checkCapacitor()
  
  // Check web camera support
  if (!isCapacitor.value) {
    isCameraSupported.value = webCamera.isCameraSupported()
    console.log('🌐 Web camera supported:', isCameraSupported.value)
  }
})

// Check Capacitor
async function checkCapacitor() {
  if (Capacitor.isNativePlatform()) {
    try {
      const module = await import('@capacitor-mlkit/barcode-scanning')
      BarcodeScanner = module.BarcodeScanner
      
      const { supported } = await BarcodeScanner.isSupported()
      if (supported) {
        isCapacitor.value = true
        console.log('✅ Capacitor camera available')
      }
    } catch (error) {
      console.error('خطا در بارگذاری BarcodeScanner:', error)
    }
  }
}

// Parse QR Data (same format as admin)
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

// Start Scan (Capacitor)
async function startScan() {
  if (!BarcodeScanner || isScanning.value) return

  try {
    isScanning.value = true

    const { camera } = await BarcodeScanner.requestPermissions()
    
    if (camera !== 'granted' && camera !== 'limited') {
      showMessage('دسترسی به دوربین رد شد', 'error')
      return
    }

    const scanResult = await BarcodeScanner.scan({
      formats: []  // Accept all formats
    })

    if (scanResult?.barcodes?.length > 0) {
      const qrData = scanResult.barcodes[0].rawValue || scanResult.barcodes[0].displayValue
      await handleQRResult(qrData)
    } else {
      showMessage('کدی شناسایی نشد', 'info')
    }
  } catch (error) {
    showMessage(`خطا در اسکن: ${error.message}`, 'error')
  } finally {
    isScanning.value = false
  }
}

// Start Web Camera Scan
async function startWebCameraScan() {
  if (!isCameraSupported.value || isScanning.value) return

  showWebCamera.value = true
  await nextTick()

  if (!videoRef.value) {
    showMessage('خطا در دسترسی به دوربین', 'error')
    return
  }

  try {
    isScanning.value = true
    showMessage('در حال اسکن...', 'info')

    const scannedCode = await webCamera.startScan(videoRef.value)
    
    if (scannedCode) {
      await handleQRResult(scannedCode)
      stopWebCamera()
    } else {
      showMessage(webCamera.error.value || 'کدی شناسایی نشد', 'error')
    }
  } catch (error) {
    showMessage(`خطا در اسکن: ${error.message}`, 'error')
  } finally {
    isScanning.value = false
  }
}

// Stop Web Camera
function stopWebCamera() {
  webCamera.stopScan()
  showWebCamera.value = false
}

// Handle QR Result
async function handleQRResult(qrData) {
  try {
    isSaving.value = true
    showMessage('در حال ثبت خروج...', 'info')

    // Parse QR data
    const productData = parseQRData(qrData)
    
    if (!productData) {
      showMessage('فرمت QR نامعتبر است', 'error')
      return
    }

    // Validate required fields
    const requiredFields = ['product', 'blend', 'origin', 'roastDate', 'batchNumber', 'packageWeight', 'packageAmount']
    const missingFields = requiredFields.filter(field => !productData[field])
    
    if (missingFields.length > 0) {
      showMessage(`فیلدهای ضروری خالی: ${missingFields.join(', ')}`, 'error')
      return
    }

    // For cafe: Always deduct 6 packages (1 carton)
    const deductionAmount = PACKAGES_PER_CARTON

    // Get the correct sheet name (replace dots with underscores)
    const sheetName = cafeName.value || user.value?.email?.split('@')[0].replace(/\./g, '_') || 'unknown'
    console.log('📊 Using sheet name:', sheetName)

    // Save to Google Sheets via API
    const response = await fetch('/api/sheets/outbound', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheetName: sheetName,
        isAdmin: false,  // Cafe is doing the scan (negative amount)
        data: {
          'Product': productData.product,
          'Blend': productData.blend,
          'Origin': productData.origin,
          'Roast-Date': productData.roastDate,
          'Batch-Number': productData.batchNumber,
          'Package-Weight': productData.packageWeight,
          'Package-Amount': productData.packageAmount,
          'cartoncount': 1,  // Always 1 carton for cafe
          'offset': 0,  // No offset for cafe
          'total-in-stock': deductionAmount,  // Will be negative in the sheet
          'Timestamp': new Date().toISOString()
        }
      })
    })

    const currentTime = new Date().toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // Save to result and history
    lastResult.value = productData

    const historyItem = {
      id: Date.now(),
      product: productData.product,
      blend: productData.blend,
      time: currentTime,
      synced: response.ok
    }

    history.value.unshift(historyItem)
    if (history.value.length > 20) {
      history.value = history.value.slice(0, 20)
    }

    saveHistory()

    if (response.ok) {
      showMessage(`✅ خروج 6 بسته ${productData.product} ثبت شد`, 'success')
    } else {
      showMessage(`خروج 6 بسته ثبت شد (آفلاین)`, 'warning')
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
function saveHistory() {
  if (typeof window !== 'undefined') {
    const today = new Date().toDateString()
    localStorage.setItem(`cafe_scan_history_${today}`, JSON.stringify(history.value))
  }
}

function loadHistory() {
  if (typeof window !== 'undefined') {
    const today = new Date().toDateString()
    const saved = localStorage.getItem(`cafe_scan_history_${today}`)
    if (saved) {
      try {
        history.value = JSON.parse(saved)
      } catch (e) {
        console.error('Error loading history:', e)
      }
    }
  }
}
</script>

<style scoped>
/* Container - Dark Theme */
.scanner-container {
  min-height: 100vh;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.scanner-card {
  width: 100%;
  max-width: 420px;
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

/* Form */
.form {
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-group {
  width: 100%;
  max-width: 280px;
  margin-bottom: 16px;
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

/* Info Box */
.info-box {
  margin-top: 20px;
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 280px;
}

.info-box svg {
  flex-shrink: 0;
  color: #3b82f6;
}

.info-box p {
  margin: 0;
  font-size: 13px;
  color: #3b82f6;
  line-height: 1.4;
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
  transform: none;
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
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
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

.result-type {
  font-size: 13px;
  padding: 4px 10px;
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
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

/* History */
.history {
  border-top: 1px solid #444;
  padding-top: 24px;
  margin-bottom: 24px;
}

.history-header {
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

.history-count {
  font-size: 11px;
  padding: 4px 10px;
  background: #404040;
  color: #b0b0b0;
  border-radius: 12px;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  padding: 12px;
  background: #333;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #444;
}

.history-item.not-synced {
  border-left: 3px solid #fbbf24;
}

.history-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.history-product {
  font-size: 13px;
  color: #ffffff;
  font-weight: 500;
}

.history-amount {
  font-size: 12px;
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-radius: 12px;
}

.history-meta {
  font-size: 11px;
  color: #808080;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sync-indicator {
  color: #fbbf24;
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

/* Footer */
.footer {
  text-align: center;
  margin-top: 24px;
}

/* Camera Styles */
.camera-container {
  background: #1a1a1a;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid #444;
  overflow: hidden;
  position: relative;
}

.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #333;
  color: #ffffff;
  font-size: 14px;
  border-bottom: 1px solid #444;
}

.close-btn {
  background: none;
  border: none;
  color: #b0b0b0;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #ffffff;
  background: #404040;
}

.camera-video {
  width: 100%;
  height: 250px;
  object-fit: cover;
  display: block;
}

.camera-overlay {
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.scan-frame {
  width: 200px;
  height: 200px;
  border: 2px solid #ffffff;
  border-radius: 8px;
  position: relative;
  margin-bottom: 16px;
}

.scan-frame::before,
.scan-frame::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid #3b82f6;
}

.scan-frame::before {
  top: -3px;
  left: -3px;
  border-right: none;
  border-bottom: none;
}

.scan-frame::after {
  bottom: -3px;
  right: -3px;
  border-left: none;
  border-top: none;
}

.camera-overlay p {
  color: #ffffff;
  font-size: 14px;
  text-align: center;
  background: rgba(0,0,0,0.7);
  padding: 8px 16px;
  border-radius: 4px;
  margin: 0;
}

/* Scrollbar */
.history-list::-webkit-scrollbar {
  width: 4px;
}

.history-list::-webkit-scrollbar-track {
  background: #333;
}

.history-list::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 2px;
}

.history-list::-webkit-scrollbar-thumb:hover {
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

.list-enter-active,
.list-leave-active {
  transition: all 0.3s;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* Mobile */
@media (max-width: 480px) {
  .scanner-card {
    padding: 32px 24px;
  }

  h1 {
    font-size: 28px;
  }

  .icon-container {
    width: 70px;
    height: 70px;
  }

  .history-list {
    max-height: 150px;
  }

  .result-grid {
    grid-template-columns: 1fr;
  }
}

/* RTL Support */
[dir="rtl"] .history-item.not-synced {
  border-left: none;
  border-right: 3px solid #fbbf24;
}
</style>