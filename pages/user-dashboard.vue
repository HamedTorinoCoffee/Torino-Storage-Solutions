<!-- pages/dashboard.vue -->
<template>
  <div class="dashboard-container">
    <div class="dashboard-card">
      <!-- Logo -->
      <div class="logo-container">
        <img 
          src="/logo.png" 
          alt="Never Say No"
          class="logo-image"
        >
      </div>

      <!-- Welcome Message -->
      <h1>داشبورد</h1>
      <p class="subtitle">
        خوش آمدید
        <span v-if="user">{{ user.email }}</span>
      </p>

      <!-- Message -->
      <Transition name="fade">
        <div v-if="message" :class="['message', `message-${message.type}`]">
          {{ message.text }}
        </div>
      </Transition>

      <!-- Main Actions -->
      <div class="actions-section">
        <!-- Scan Button -->
        <button @click="goToScan" class="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="7" y1="7" x2="7" y2="17"/>
            <line x1="12" y1="7" x2="12" y2="17"/>
            <line x1="17" y1="7" x2="17" y2="17"/>
          </svg>
          <span>اسکن بارکد / QR Code</span>
        </button>

        <!-- History Button -->
        <button @click="goToHistory" class="btn btn-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2" stroke-linecap="round"/>
          </svg>
          <span>تاریخچه اسکن‌ها</span>
        </button>
      </div>

      <!-- Stats Section -->
      <div v-if="stats" class="stats-section">
        <div class="stat-item">
          <span class="stat-value">{{ stats.todayScans || 0 }}</span>
          <span class="stat-label">اسکن امروز</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.totalScans || 0 }}</span>
          <span class="stat-label">کل اسکن‌ها</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.syncedScans || 0 }}</span>
          <span class="stat-label">همگام‌سازی شده</span>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="quick-links">
        <div class="section-header">
          <span class="section-title">دسترسی سریع</span>
        </div>
        
        <div class="links-grid">
          <!-- Telegram Order -->
          <a 
            href="https://t.me/Torinowholesale_bot?start=w42993986"
            target="_blank"
            rel="noopener noreferrer"
            class="link-card"
          >
            <div class="link-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
              </svg>
            </div>
            <div class="link-content">
              <div class="link-title">سفارش تلگرام</div>
              <div class="link-subtitle">ثبت سفارش از طریق ربات</div>
            </div>
            <div class="link-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 17l9.2-9.2M17 17V7H7"/>
              </svg>
            </div>
          </a>

          <!-- Help -->
          <div @click="showHelp" class="link-card">
            <div class="link-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div class="link-content">
              <div class="link-title">راهنما</div>
              <div class="link-subtitle">نحوه استفاده از برنامه</div>
            </div>
          </div>

          <!-- Settings -->
          <div @click="goToSettings" class="link-card">
            <div class="link-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m6.66-10.4l-4.24 4.24M9.58 9.58L5.34 5.34m13.32 13.32l-4.24-4.24m-4.84-4.84L5.34 18.66"/>
              </svg>
            </div>
            <div class="link-content">
              <div class="link-title">تنظیمات</div>
              <div class="link-subtitle">پروفایل و تنظیمات حساب</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="footer-actions">
        <button @click="handleLogout" :disabled="isLoading" class="btn btn-outline btn-logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span v-if="!isLoading">خروج از حساب</span>
          <span v-else>
            <span class="spinner"></span>
            در حال خروج...
          </span>
        </button>
      </div>

      <!-- Version -->
      <div class="version">
        نسخه 1.0.0
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { navigateTo } from '#app'

// Auth composable
const { user, logout, getUserScans, isLoading: authLoading } = useAuth()

// Runtime config
const config = useRuntimeConfig()
const adminEmail = config.public.firstAdminEmail || ''

// State
const stats = ref(null)
const isLoading = ref(false)
const message = ref(null)

// Check auth on mount
onMounted(async () => {
  console.log('📊 User dashboard mounted')
  console.log('👤 User:', user.value)
  console.log('🔄 AuthLoading:', authLoading.value)
  
  // صبر کردن برای لود شدن وضعیت احراز هویت
  let attempts = 0
  while (authLoading.value && attempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
    console.log(`⏳ Waiting for auth... attempt ${attempts}`)
  }
  
  console.log('🔍 Final auth state - User:', user.value, 'Loading:', authLoading.value)
  
  // چک کردن احراز هویت
  if (!user.value) {
    console.log('❌ No user found, redirecting to login')
    await navigateTo('/login')
    return
  }
  
  // اگر admin است، به پنل admin برو
  if (user.value.email === adminEmail) {
    console.log('🔐 Admin detected, redirecting to admin panel')
    await navigateTo('/admin/admin-index')
    return
  }
  
  // بارگذاری آمار کاربر عادی
  await loadStats()
})

// Load statistics
async function loadStats() {
  try {
    const result = await getUserScans(100)
    if (result.success && result.data) {
      const scans = result.data
      
      // Calculate stats
      const today = new Date().toDateString()
      const todayScans = scans.filter(scan => 
        new Date(scan.scanned_at).toDateString() === today
      ).length
      
      const syncedScans = scans.filter(scan => scan.synced_to_sheets).length
      
      stats.value = {
        todayScans,
        totalScans: scans.length,
        syncedScans
      }
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

// Navigation Methods
const goToScan = () => {
  navigateTo('/scan')
}

const goToHistory = () => {
  showMessage('صفحه تاریخچه در حال توسعه است', 'info')
}

const goToSettings = () => {
  showMessage('صفحه تنظیمات در حال توسعه است', 'info')
}

const showHelp = () => {
  showMessage('برای اسکن کد، روی دکمه "اسکن بارکد" کلیک کنید. می‌توانید کد را به صورت دستی نیز وارد نمایید.', 'info')
}

// Logout handler
const handleLogout = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  try {
    const result = await logout()
    if (result.success) {
      showMessage('خروج با موفقیت انجام شد', 'success')
      setTimeout(() => {
        navigateTo('/login')
      }, 1000)
    }
  } catch (error) {
    console.error('Logout error:', error)
    showMessage('خطا در خروج از حساب', 'error')
  } finally {
    isLoading.value = false
  }
}

// Show Message
function showMessage(text, type) {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 3000)
}
</script>

<style scoped>
/* Container */
.dashboard-container {
  min-height: 100vh;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.dashboard-card {
  width: 100%;
  max-width: 480px;
  padding: 40px 32px;
}

/* Logo */
.logo-container {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #555;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Typography */
h1 {
  font-size: 32px;
  font-weight: 300;
  letter-spacing: -1.5px;
  text-align: center;
  margin-bottom: 8px;
  color: #ffffff;
}

.subtitle {
  text-align: center;
  color: #b0b0b0;
  font-size: 14px;
  margin-bottom: 32px;
}

.subtitle span {
  color: #ffffff;
  display: block;
  margin-top: 4px;
  font-size: 13px;
}

/* Message */
.message {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
  max-width: 100%;
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

/* Actions Section */
.actions-section {
  margin-bottom: 32px;
}

/* Buttons */
.btn {
  width: 100%;
  padding: 16px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
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

.btn-secondary {
  background: #404040;
  color: #ffffff;
  border: 1px solid #555;
}

.btn-secondary:hover:not(:disabled) {
  background: #484848;
  border-color: #666;
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: #b0b0b0;
  border: 1px solid #555;
}

.btn-outline:hover:not(:disabled) {
  background: #404040;
  color: #ffffff;
  border-color: #666;
}

.btn-logout {
  color: #ff6b6b;
  border-color: rgba(239, 68, 68, 0.3);
}

.btn-logout:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.5);
}

.btn:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
  border-color: #444;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
  padding: 24px;
  background: #333;
  border-radius: 12px;
  border: 1px solid #444;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 300;
  color: #ffffff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 11px;
  color: #808080;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Quick Links */
.quick-links {
  border-top: 1px solid #444;
  padding-top: 24px;
  margin-bottom: 24px;
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #b0b0b0;
}

.links-grid {
  display: grid;
  gap: 12px;
}

.link-card {
  display: flex;
  align-items: center;
  padding: 14px;
  background: #333;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #444;
}

.link-card:hover {
  background: #3a3a3a;
  border-color: #555;
  transform: translateY(-1px);
}

.link-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
  border-radius: 8px;
  margin-left: 12px;
  color: #b0b0b0;
}

.link-content {
  flex: 1;
}

.link-title {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 2px;
}

.link-subtitle {
  font-size: 12px;
  color: #808080;
}

.link-arrow {
  color: #666;
}

/* Footer Actions */
.footer-actions {
  border-top: 1px solid #444;
  padding-top: 24px;
  margin-bottom: 16px;
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
  margin-left: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Version */
.version {
  text-align: center;
  color: #666;
  font-size: 11px;
  margin-top: 24px;
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

/* Mobile Responsive */
@media (max-width: 480px) {
  .dashboard-card {
    padding: 32px 24px;
  }

  h1 {
    font-size: 28px;
  }

  .logo-container {
    width: 70px;
    height: 70px;
  }

  .stats-section {
    padding: 16px;
  }

  .stat-value {
    font-size: 20px;
  }

  .btn {
    padding: 14px 20px;
    font-size: 14px;
  }

  .link-card {
    padding: 12px;
  }
}

/* RTL Support */
[dir="rtl"] .link-icon {
  margin-left: 0;
  margin-right: 12px;
}

[dir="rtl"] .spinner {
  margin-left: 0;
  margin-right: 8px;
}
</style>