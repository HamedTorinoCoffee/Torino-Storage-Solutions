<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '~/composables/useAuth'
import { useWebCamera } from '~/composables/useWebCamera'

// استفاده از useAuth
const { saveScan, user } = useAuth()

// Web camera support
const webCamera = useWebCamera()

// State
const isCapacitor = ref(false)
const isCameraSupported = ref(false)
const isScanning = ref(false)
const isSaving = ref(false)
const manualInput = ref('')
const result = ref(null)
const message = ref(null)
const history = ref([])
const showWebCamera = ref(false)

// Refs
const videoRef = ref()

let BarcodeScanner = null

// Lifecycle
onMounted(async () => {
  console.log('📷 Scan page mounted')
  console.log('👤 User:', user.value)
  
  // بدون بررسی احراز هویت، مستقیماً به بارگذاری ادامه می‌دهیم
  loadHistory()
  await checkCapacitor()
  
  // Check web camera support
  if (!isCapacitor.value) {
    isCameraSupported.value = webCamera.isCameraSupported()
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
      }
    } catch (error) {
      console.error('خطا در بارگذاری BarcodeScanner:', error)
    }
  }
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
      formats: []
    })

    if (scanResult?.barcodes?.length > 0) {
      const barcode = scanResult.barcodes[0]
      await handleResult(
        barcode.rawValue || barcode.displayValue,
        formatType(barcode.format)
      )
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
      await handleResult(scannedCode, detectBarcodeType(scannedCode))
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

// Detect barcode type from content
function detectBarcodeType(value) {
  if (value.startsWith('http') || value.includes('://')) {
    return 'QR CODE'
  }
  if (value.length >= 8 && value.length <= 14 && /^\d+$/.test(value)) {
    return value.length === 13 ? 'EAN-13' : 'EAN-8'
  }
  return 'BARCODE'
}

// Submit Manual Code
async function submitCode() {
  const value = manualInput.value.trim()
  if (!value) return

  let type = 'BARCODE'
  if (value.startsWith('http') || value.includes('://') || value.length > 50) {
    type = 'QR CODE'
  }

  await handleResult(value, type)
  clearInput()
}

// Handle Result
async function handleResult(value, type) {
  try {
    isSaving.value = true
    showMessage('در حال ذخیره...', 'info')

    result.value = { value, type }

    const item = {
      id: Date.now(),
      value,
      type,
      time: new Date().toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      synced: false
    }

    history.value.unshift(item)
    if (history.value.length > 10) {
      history.value = history.value.slice(0, 10)
    }

    const saveResult = await saveScan({ value, type })

    if (saveResult.success) {
      const historyItem = history.value.find(h => h.id === item.id)
      if (historyItem) {
        historyItem.synced = true
      }
      showMessage('اسکن با موفقیت ثبت شد', 'success')
    } else {
      showMessage(`خطا در ذخیره: ${saveResult.error}`, 'error')
    }

    saveHistory()
  } catch (error) {
    showMessage(`خطا در پردازش: ${error.message}`, 'error')
  } finally {
    isSaving.value = false
  }
}

// Format Type
function formatType(format) {
  const types = {
    'QR_CODE': 'QR CODE',
    'DATA_MATRIX': 'DATA MATRIX',
    'EAN_13': 'EAN-13',
    'EAN_8': 'EAN-8',
    'UPC_A': 'UPC-A',
    'UPC_E': 'UPC-E',
    'CODE_128': 'CODE 128',
    'CODE_39': 'CODE 39',
    'ITF': 'ITF',
    'PDF417': 'PDF417',
    'AZTEC': 'AZTEC'
  }
  return types[format] || format || 'BARCODE'
}

// Copy Result
async function copyResult() {
  if (!result.value) return

  try {
    await navigator.clipboard.writeText(result.value.value)
    showMessage('کد کپی شد', 'success')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = result.value.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    // Using fallback copy method
    document.body.removeChild(textarea)
    showMessage('کد کپی شد', 'success')
  }
}

// Clear Functions
function clearInput() {
  manualInput.value = ''
}

function clearResult() {
  result.value = null
}

// Fill From History
function fillFromHistory(value) {
  manualInput.value = value
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
    localStorage.setItem('scanHistory', JSON.stringify(history.value))
  }
}

function loadHistory() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('scanHistory')
    if (saved) {
      try {
        history.value = JSON.parse(saved)
      } catch (e) {
        console.error('Error loading history:', e)
      }
    }
  }
}

// Sync pending scans
async function syncPendingScans() {
  const pendingScans = history.value.filter(item => !item.synced)
  
  if (pendingScans.length === 0) {
    showMessage('همه اسکن‌ها همگام‌سازی شده‌اند', 'info')
    return
  }
  
  for (const scan of pendingScans) {
    try {
      const result = await saveScan({ 
        value: scan.value, 
        type: scan.type 
      })
      
      if (result.success) {
        scan.synced = true
      }
    } catch (error) {
      console.warn('خطا در sync:', error)
    }
  }
  
  saveHistory()
  showMessage(`${pendingScans.filter(s => s.synced).length} از ${pendingScans.length} اسکن همگام‌سازی شد`, 'success')
}
</script>

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
        <h1>اسکنر بارکد</h1>
        <p class="subtitle">کد را اسکن یا وارد کنید</p>
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
          <span v-if="!isScanning && !isSaving">اسکن با دوربین</span>
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
          <span v-if="!isScanning && !isSaving">اسکن با دوربین</span>
          <span v-else-if="isScanning">
            <span class="spinner"></span>
            در حال اسکن...
          </span>
          <span v-else>
            <span class="spinner"></span>
            در حال ذخیره...
          </span>
        </button>

        <div v-if="isCapacitor || isCameraSupported" class="divider">
          <span>یا</span>
        </div>

        <!-- Manual Input -->
        <div class="input-group">
          <label for="barcode" class="label">ورود دستی</label>
          <div class="input-wrapper">
            <input
              id="barcode"
              v-model="manualInput"
              type="text"
              placeholder="کد را وارد کنید"
              @keyup.enter="submitCode"
              :disabled="isSaving"
              class="input-field"
              autocomplete="off"
            />
            <button
              v-if="manualInput"
              @click="clearInput"
              class="clear-btn"
              type="button"
              aria-label="پاک کردن"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          @click="submitCode"
          :disabled="!manualInput || isSaving"
          class="btn btn-primary"
        >
          <span v-if="!isSaving">ارسال</span>
          <span v-else>
            <span class="spinner"></span>
            در حال ذخیره...
          </span>
        </button>
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
            <p>کد بارکد یا QR کد را در کادر قرار دهید</p>
          </div>
        </div>
      </Transition>

      <!-- Result Box -->
      <Transition name="slide">
        <div v-if="result" class="result-box">
          <div class="result-header">
            <span class="result-label">نتیجه اسکن</span>
            <span class="result-type">{{ result.type }}</span>
          </div>
          <div class="result-value">{{ result.value }}</div>
          <div class="result-actions">
            <button @click="copyResult" class="btn btn-secondary">کپی</button>
            <button @click="clearResult" class="btn btn-secondary">پاک کردن</button>
          </div>
        </div>
      </Transition>

      <!-- History Section -->
      <div v-if="history.length > 0" class="history">
        <div class="history-header">
          <span class="section-title">تاریخچه</span>
          <button
            v-if="history.some(h => !h.synced)"
            @click="syncPendingScans"
            class="sync-btn"
            title="همگام‌سازی"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            <span>{{ history.filter(h => !h.synced).length }}</span>
          </button>
        </div>
        
        <div class="history-list">
          <TransitionGroup name="list">
            <div
              v-for="item in history"
              :key="item.id"
              @click="fillFromHistory(item.value)"
              :class="['history-item', { 'not-synced': !item.synced }]"
            >
              <div class="history-value">{{ item.value }}</div>
              <div class="history-meta">
                <span>{{ item.time }}</span>
                <span class="dot">•</span>
                <span>{{ item.type }}</span>
                <span v-if="!item.synced" class="sync-indicator">⚠</span>
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
  color: #ffffff;
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
  padding: 10px 40px 10px 14px;
  border: 1px solid #555;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
  background: #404040;
  color: #ffffff;
  text-align: center;
  font-family: 'SF Mono', Monaco, monospace;
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
  color: #808080;
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #808080;
  transition: color 0.2s;
  padding: 0;
}

.clear-btn:hover {
  color: #ffffff;
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

.btn-secondary {
  background: #404040;
  color: #ffffff;
  border: 1px solid #555;
  padding: 10px 16px;
  font-size: 13px;
}

.btn-secondary:hover {
  background: #484848;
  border-color: #666;
  transform: none;
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

/* Result Box */
.result-box {
  background: #333;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #444;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-label {
  font-size: 12px;
  color: #b0b0b0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-type {
  font-size: 10px;
  padding: 4px 8px;
  background: #000;
  color: #fff;
  border-radius: 4px;
  text-transform: uppercase;
}

.result-value {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 16px;
  color: #ffffff;
  word-break: break-all;
  margin-bottom: 16px;
  padding: 12px;
  background: #2a2a2a;
  border-radius: 4px;
}

.result-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
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

.sync-btn {
  background: transparent;
  border: 1px solid #3b82f6;
  color: #3b82f6;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  font-size: 12px;
}

.sync-btn:hover {
  background: rgba(59, 130, 246, 0.1);
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  padding: 12px;
  background: #333;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #444;
}

.history-item:hover {
  background: #3a3a3a;
  border-color: #555;
}

.history-item.not-synced {
  border-left: 3px solid #fbbf24;
}

.history-value {
  font-size: 13px;
  color: #ffffff;
  margin-bottom: 4px;
  word-break: break-all;
  font-family: 'SF Mono', Monaco, monospace;
}

.history-meta {
  font-size: 11px;
  color: #808080;
  display: flex;
  align-items: center;
  gap: 4px;
}

.history-meta .dot {
  margin: 0 2px;
}

.sync-indicator {
  color: #fbbf24;
  margin-right: 4px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 0;
  color: #666;
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

/* Scrollbar */
.history-list::-webkit-scrollbar {
  width: 4px;
}

.history-list::-webkit-scrollbar-track {
  background: #2a2a2a;
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

  .btn {
    padding: 10px 16px;
    font-size: 13px;
  }
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
  border: 3px solid #22c55e;
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

/* RTL Support */
[dir="rtl"] .history-item.not-synced {
  border-left: none;
  border-right: 3px solid #fbbf24;
}

[dir="rtl"] .sync-indicator {
  margin-right: 0;
  margin-left: 4px;
}
</style>