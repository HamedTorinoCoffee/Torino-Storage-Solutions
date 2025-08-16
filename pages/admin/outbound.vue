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

      <!-- Message -->
      <Transition name="fade">
        <div v-if="message" :class="['message', `message-${message.type}`]">
          {{ message.text }}
        </div>
      </Transition>

      <!-- Cafe Selection -->
      <div class="cafe-selection">
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
              :value="cafe.email"
            >
              {{ cafe.user_metadata?.full_name || cafe.email }}
            </option>
          </select>
          <div class="select-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Main Form -->
      <div v-if="selectedCafe" class="form">
        <!-- Camera Button (if Capacitor) -->
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

        <div v-if="isCapacitor" class="divider">
          <span>یا</span>
        </div>

        <!-- Manual Input -->
        <div class="input-group">
          <label for="qrcode" class="label">ورود دستی QR Data</label>
          <div class="input-wrapper">
            <textarea
              id="qrcode"
              v-model="manualInput"
              placeholder='{"blend":"Arabica 100%","origin":"Colombia","roastDate":"2024-12-20","batch":"B-2024-001","weight":"1kg","amount":10}'
              @keyup.enter.ctrl="submitCode"
              :disabled="isSaving"
              class="input-field"
              rows="3"
            />
          </div>
          <small class="input-hint">JSON فرمت - Ctrl+Enter برای ارسال</small>
        </div>

        <!-- Submit Button -->
        <button
          @click="submitCode"
          :disabled="!manualInput || isSaving"
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
      <div v-else class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p>لطفاً ابتدا کافه مورد نظر را انتخاب کنید</p>
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
              <span class="item-value">{{ lastResult.data.batch }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">وزن:</span>
              <span class="item-value">{{ lastResult.data.weight }}</span>
            </div>
            <div class="result-item">
              <span class="item-label">تعداد:</span>
              <span class="item-value">{{ lastResult.data.amount }}</span>
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
              <span>{{ item.blend }}</span>
              <span class="dot">•</span>
              <span>{{ item.amount }} بسته</span>
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
import { ref, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '~/composables/useAuth'
import { navigateTo } from '#app'

console.log('📦 Outbound page is loading!')

// Auth
const { user } = useAuth()

// Admin email from config
const config = useRuntimeConfig()
const adminEmail = config.public.firstAdminEmail || ''

// State
const isCapacitor = ref(false)
const isScanning = ref(false)
const isSaving = ref(false)
const isLoading = ref(false)
const manualInput = ref('')
const message = ref(null)
const lastResult = ref(null)
const todaySummary = ref([])

// Cafe Selection
const cafes = ref([])
const selectedCafe = ref('')

let BarcodeScanner = null

// Lifecycle
onMounted(async () => {
  console.log('🚚 Outbound page mounted')
  console.log('👤 User:', user.value)
  console.log('📧 Admin email:', adminEmail)
  
  // ✅ احراز هویت موقتاً غیرفعال شده
  /*
  if (!user.value || user.value.email !== adminEmail) {
    console.log('❌ Not admin, redirecting to login')
    await navigateTo('/login')
    return
  }
  */
  
  console.log('✅ Admin access granted (auth temporarily disabled)')
  
  // Load cafes - موقتاً با داده‌های ثابت
  await loadCafes()
  
  // Check Capacitor
  await checkCapacitor()
  
  // Load today's summary
  loadTodaySummary()
})

// Load Cafes - با داده‌های ثابت برای تست
async function loadCafes() {
  isLoading.value = true
  try {
    // لیست ثابت کافه‌ها برای تست
    cafes.value = [
      { 
        id: '1', 
        email: 'cafe1@example.com', 
        user_metadata: { full_name: 'کافه آرامش' } 
      },
      { 
        id: '2', 
        email: 'cafe2@example.com', 
        user_metadata: { full_name: 'کافه صبح' } 
      },
      { 
        id: '3', 
        email: 'cafe3@example.com', 
        user_metadata: { full_name: 'کافه هنر' } 
      },
      { 
        id: '4', 
        email: 'cafe4@example.com', 
        user_metadata: { full_name: 'کافه دوستی' } 
      }
    ]
    
    console.log('☕ Loaded cafes:', cafes.value.length)
  } catch (error) {
    console.error('Error loading cafes:', error)
    showMessage('خطا در بارگذاری لیست کافه‌ها', 'error')
  } finally {
    isLoading.value = false
  }
}

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

// Start Scan
async function startScan() {
  if (!BarcodeScanner || isScanning.value) return
  
  if (!selectedCafe.value) {
    showMessage('لطفاً ابتدا کافه را انتخاب کنید', 'error')
    return
  }

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
      await handleResult(qrData)
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

  await handleResult(value)
  clearInput()
}

// Handle Result
async function handleResult(qrData) {
  try {
    isSaving.value = true
    showMessage('در حال ثبت خروج...', 'info')

    // Parse QR data
    let productData
    try {
      productData = JSON.parse(qrData)
    } catch (e) {
      showMessage('فرمت QR نامعتبر است', 'error')
      return
    }

    // Validate required fields
    const requiredFields = ['blend', 'origin', 'roastDate', 'batch', 'weight', 'amount']
    const missingFields = requiredFields.filter(field => !productData[field])
    
    if (missingFields.length > 0) {
      showMessage(`فیلدهای ضروری: ${missingFields.join(', ')}`, 'error')
      return
    }

    // Get cafe name
    const cafe = cafes.value.find(c => c.email === selectedCafe.value)
    const cafeName = cafe?.user_metadata?.full_name || cafe?.email || selectedCafe.value

    // Save to Google Sheets via API
    const response = await fetch('/api/sheets/outbound', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheetName: selectedCafe.value,
        data: {
          'Type': 'ورود',
          'ProductBlend': productData.blend,
          'Origin': productData.origin,
          'Roast-Date': productData.roastDate,
          'Batch-Number': productData.batch,
          'Package-Weight': productData.weight,
          'Package-Amount': Math.abs(productData.amount),
          'Timestamp': new Date().toISOString()
        }
      })
    })

    if (response.ok) {
      // Save to last result
      lastResult.value = {
        cafe: cafeName,
        data: productData,
        time: new Date().toLocaleTimeString('fa-IR')
      }

      // Add to today's summary
      todaySummary.value.unshift({
        cafe: cafeName,
        blend: productData.blend,
        amount: productData.amount,
        time: new Date().toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      })

      // Save to localStorage
      saveTodaySummary()

      showMessage(`خروج برای ${cafeName} با موفقیت ثبت شد`, 'success')
    } else {
      // برای تست، حتی بدون API کار کنه
      const currentTime = new Date().toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit'
      })

      lastResult.value = {
        cafe: cafeName,
        data: productData,
        time: new Date().toLocaleTimeString('fa-IR')
      }

      todaySummary.value.unshift({
        cafe: cafeName,
        blend: productData.blend,
        amount: productData.amount,
        time: currentTime
      })

      saveTodaySummary()
      showMessage(`خروج برای ${cafeName} ثبت شد (آفلاین)`, 'info')
    }

  } catch (error) {
    console.error('خطا در پردازش:', error)
    showMessage(`خطا در پردازش: ${error.message}`, 'error')
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
/* Container - ذغالی تیره */
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