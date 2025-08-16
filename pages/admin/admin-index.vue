<!-- pages/admin-index.vue -->
<template>
  <div class="admin-container">
    <div class="admin-card">
      <!-- Header -->
      <div class="header">
        <div class="logo-container">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" 
                  stroke="currentColor" stroke-width="1.5" fill="currentColor" opacity="0.1"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h1>پنل مدیریت انبار</h1>
        <p class="subtitle">
          خوش آمدید مدیر گرامی
          <span v-if="user">{{ user.email }}</span>
        </p>
      </div>

      <!-- Message -->
      <Transition name="fade">
        <div v-if="message" :class="['message', `message-${message.type}`]">
          {{ message.text }}
        </div>
      </Transition>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon inventory">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalProducts || 0 }}</span>
            <span class="stat-label">محصول در انبار</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon outbound">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.todayOutbound || 0 }}</span>
            <span class="stat-label">خروج امروز</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon customers">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.activeCustomers || 0 }}</span>
            <span class="stat-label">مشتری فعال</span>
          </div>
        </div>
      </div>

      <!-- Main Actions -->
      <div class="actions-section">
        <h2 class="section-title">عملیات انبار</h2>
        
        <!-- Inventory Button -->
        <NuxtLink to="/admin/inventory" class="action-btn inventory-btn">
          <div class="btn-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
              <polyline points="7.5 19.79 7.5 14.6 3 12"/>
              <polyline points="21 12 16.5 14.6 16.5 19.79"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div class="btn-content">
            <h3>موجودی انبار</h3>
            <p>اسکن و ثبت موجودی محصولات</p>
          </div>
          <div class="btn-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </NuxtLink>

        <!-- Outbound Button -->
        <NuxtLink to="/admin/outbound" class="action-btn outbound-btn">
          <div class="btn-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div class="btn-content">
            <h3>خروج کالا</h3>
            <p>ثبت خروج و تحویل به مشتریان</p>
          </div>
          <div class="btn-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </NuxtLink>
      </div>

      <!-- Quick Links -->
      <div class="quick-links">
        <h2 class="section-title">دسترسی سریع</h2>
        
        <div class="links-grid">
          <!-- Reports -->
          <div @click="showReports" class="link-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>گزارشات</span>
          </div>

          <!-- Settings -->
          <div @click="showSettings" class="link-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m6.66-10.4l-4.24 4.24M9.58 9.58L5.34 5.34m13.32 13.32l-4.24-4.24m-4.84-4.84L5.34 18.66"/>
            </svg>
            <span>تنظیمات</span>
          </div>

          <!-- Supabase -->
          <a 
            href="https://app.supabase.com" 
            target="_blank" 
            rel="noopener noreferrer"
            class="link-card"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
            </svg>
            <span>Supabase</span>
          </a>

          <!-- Google Sheets -->
          <a 
            href="https://sheets.google.com" 
            target="_blank" 
            rel="noopener noreferrer"
            class="link-card"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="10"/>
              <rect x="3" y="17" width="18" height="4"/>
              <rect x="3" y="13" width="9" height="4"/>
              <rect x="12" y="13" width="9" height="4"/>
            </svg>
            <span>Google Sheets</span>
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <button @click="goToDashboard" class="btn btn-outline">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          داشبورد کاربر
        </button>
        
        <button @click="handleLogout" class="btn btn-outline btn-logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          خروج از حساب
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { navigateTo } from '#app'

// Auth composable
const { user, logout } = useAuth()

// Admin email from config
const config = useRuntimeConfig()
const adminEmail = config.public.firstAdminEmail || ''

// State
const message = ref(null)
const stats = ref({
  totalProducts: 0,
  todayOutbound: 0,
  activeCustomers: 0
})

// Check if user is admin
const checkAdminAccess = () => {
  // ✅ موقتاً غیرفعال شده برای تست
  return true
  
  // if (!user.value || user.value.email !== adminEmail) {
  //   console.log('❌ Not admin, redirecting to login')
  //   navigateTo('/login')
  //   return false
  // }
  // return true
}

// Lifecycle
onMounted(() => {
  console.log('🔐 Admin dashboard mounted')
  console.log('👤 Admin user:', user.value)
  console.log('📧 Admin email config:', adminEmail)
  
  // موقتاً چک نمی‌کنیم
  // if (!checkAdminAccess()) return
  
  // Load stats (این رو بعداً از Google Sheets یا Supabase می‌گیریم)
  loadStats()
})

// Load Stats (موقت - بعداً real data)
function loadStats() {
  // این اعداد موقتی هستند
  stats.value = {
    totalProducts: 125,
    todayOutbound: 8,
    activeCustomers: 14
  }
}

// Navigation
function goToDashboard() {
  navigateTo('/dashboard')
}

// Actions
function showReports() {
  showMessage('گزارشات در حال توسعه است', 'info')
}

function showSettings() {
  showMessage('تنظیمات در حال توسعه است', 'info')
}

// Logout
async function handleLogout() {
  try {
    const result = await logout()
    if (result.success) {
      showMessage('خروج با موفقیت انجام شد', 'success')
      setTimeout(() => {
        navigateTo('/login')
      }, 1000)
    }
  } catch (error) {
    showMessage('خطا در خروج', 'error')
  }
}

// Message
function showMessage(text, type) {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 3000)
}
</script>

<style scoped>
/* Container - پس‌زمینه ذغالی */
.admin-container {
  min-height: 100vh;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.admin-card {
  width: 100%;
  max-width: 600px;
  padding: 40px;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-container {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  border-radius: 50%;
  border: 2px solid #555;
  color: white;
}

h1 {
  font-size: 28px;
  font-weight: 300;
  letter-spacing: -1.5px;
  color: #ffffff;
  margin-bottom: 8px;
}

.subtitle {
  color: #b0b0b0;
  font-size: 14px;
}

.subtitle span {
  display: block;
  margin-top: 4px;
  color: #808080;
  font-weight: 500;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: #333;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid #444;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.stat-icon.inventory {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.stat-icon.outbound {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.stat-icon.customers {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
}

.stat-label {
  font-size: 12px;
  color: #808080;
  margin-top: 4px;
}

/* Actions Section */
.actions-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #b0b0b0;
  margin-bottom: 16px;
}

.action-btn {
  width: 100%;
  background: #333;
  border: 2px solid #444;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  color: inherit;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
  background: #3a3a3a;
}

.inventory-btn:hover {
  border-color: #3b82f6;
}

.outbound-btn:hover {
  border-color: #22c55e;
}

.btn-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.inventory-btn .btn-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.outbound-btn .btn-icon {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.btn-content {
  flex: 1;
  text-align: right;
}

.btn-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
}

.btn-content p {
  font-size: 13px;
  color: #808080;
}

.btn-arrow {
  color: #666;
}

/* Quick Links */
.quick-links {
  margin-bottom: 32px;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.link-card {
  background: #333;
  border: 1px solid #444;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  color: inherit;
}

.link-card:hover {
  background: #3a3a3a;
  border-color: #555;
  transform: translateY(-1px);
}

.link-card svg {
  color: #808080;
}

.link-card span {
  font-size: 12px;
  color: #b0b0b0;
  text-align: center;
}

/* Message */
.message {
  padding: 12px 16px;
  border-radius: 8px;
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
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.message-info {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Footer */
.footer {
  display: flex;
  gap: 12px;
  border-top: 1px solid #444;
  padding-top: 24px;
}

.btn {
  flex: 1;
  padding: 12px 20px;
  border: 1px solid #555;
  border-radius: 10px;
  background: transparent;
  color: #b0b0b0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:hover {
  background: #333;
  border-color: #666;
  color: #ffffff;
}

.btn-logout {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.5);
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

/* Mobile */
@media (max-width: 640px) {
  .admin-card {
    padding: 32px 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    flex-direction: row;
    justify-content: flex-start;
    gap: 12px;
  }

  .links-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-btn {
    padding: 16px;
  }

  .btn-icon {
    width: 48px;
    height: 48px;
  }

  .btn-content h3 {
    font-size: 16px;
  }
}

/* RTL */
[dir="rtl"] .btn-content {
  text-align: left;
}

[dir="rtl"] .btn-arrow {
  transform: rotate(180deg);
}
</style>