<!-- pages/login.vue -->
<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo/Icon - Updated to use image -->
      <div class="logo-container">
        <img 
          src="/logo.png" 
          alt="Never Say No"
          class="logo-image"
        >
      </div>

      <!-- Title -->
      <h1>ورود به حساب</h1>
      <p class="subtitle">خوش آمدید، لطفا وارد شوید</p>

      <!-- Error Message -->
      <Transition name="fade">
        <div v-if="errorMessage" class="message message-error">
          {{ errorMessage }}
        </div>
      </Transition>

      <!-- Login Form -->
      <form @submit.prevent="handleSubmit" class="form">
        <!-- Email Input -->
        <div class="input-group">
          <label for="email" class="label">ایمیل</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="example@email.com"
            class="input-field"
            required
            :disabled="isLoading"
            autocomplete="email"
          >
        </div>

        <!-- Password Input -->
        <div class="input-group">
          <label for="password" class="label">رمز عبور</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="••••••••"
            class="input-field"
            required
            :disabled="isLoading"
            autocomplete="current-password"
          >
        </div>

        <!-- Remember Me Only -->
        <div class="form-options">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="rememberMe"
              class="checkbox"
            >
            <span>مرا به خاطر بسپار</span>
          </label>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit"
          :disabled="isLoading || authLoading"
          class="btn btn-primary"
        >
          <span v-if="!isLoading && !authLoading">ورود</span>
          <span v-else class="loading">
            <span class="spinner"></span>
            در حال ورود...
          </span>
        </button>
      </form>

      <!-- Sign Up Link -->
      <div class="footer-link">
        <a 
          href="https://t.me/Torinowholesale_bot?start=w42993986" 
          target="_blank"
          rel="noopener noreferrer"
          class="link"
        >
          درخواست ایجاد حساب کاربری
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { navigateTo } from '#app'

const route = useRoute()
const { login, isLoading: authLoading } = useAuth()

// State
const isLoading = ref(false)
const errorMessage = ref('')
const rememberMe = ref(false)
const formData = ref({
  email: '',
  password: ''
})

// Admin emails from runtime config
const config = useRuntimeConfig()
const adminEmails = (config.public.adminEmails || 'h.aghasi@torino.company,amirhassan@torino.company')
  .split(',')
  .map(email => email.trim().toLowerCase())

// Redirect path - default based on user type
const redirectTo = ref('/user-dashboard')

onMounted(() => {
  const redirect = route.query.redirect
  if (redirect) {
    redirectTo.value = decodeURIComponent(redirect)
  }
  
  // Load saved email if remember me was checked
  const savedEmail = localStorage.getItem('rememberedEmail')
  if (savedEmail) {
    formData.value.email = savedEmail
    rememberMe.value = true
  }
})

// Handle email/password login with admin check
const handleSubmit = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    // Save email if remember me is checked
    if (rememberMe.value) {
      localStorage.setItem('rememberedEmail', formData.value.email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }
    
    console.log('🔐 Attempting login with:', formData.value.email)
    console.log('🔑 Admin email from config:', adminEmail)
    
    // Debug: بررسی دقیق
    console.log('📧 Email comparison:')
    console.log('  - User email:', formData.value.email)
    console.log('  - Admin email:', adminEmail)
    console.log('  - Are equal?:', formData.value.email === adminEmail)
    
    const result = await login(formData.value.email, formData.value.password)
    
    console.log('📊 Login result:', result)
    
    if (result.success) {
      console.log('✅ Login successful')
      
      // Check if user is admin
    const isAdmin = adminEmails.includes(formData.value.email.toLowerCase()) 
      
      // Redirect based on user type
      if (isAdmin) {
        console.log('🔐 Redirecting to admin dashboard')
        await navigateTo('/admin/admin-index')  // ✅ رفتن به صفحه admin-index
      } else {
        console.log('📍 Redirecting to user dashboard')
        // اگر redirect query param داشتیم از اون استفاده کن، وگرنه به dashboard برو
        await navigateTo(redirectTo.value || '/user-dashboard')  // ✅ تغییر به صفحه کاربر
      }
    } else {
      console.error('❌ Login failed:', result.error)
      errorMessage.value = result.error || 'خطا در ورود به سیستم'
    }
  } catch (err) {
    console.error('❌ Login error:', err)
    errorMessage.value = 'خطا در ورود به سیستم'
  } finally {
    isLoading.value = false
  }
}

// Clear error when user types
watch([() => formData.value.email, () => formData.value.password], () => {
  if (errorMessage.value) {
    errorMessage.value = ''
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: #2a2a2a; /* Charcoal background */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 380px;
  padding: 40px 32px;
  background: transparent; /* Remove card background */
  border-radius: 0; /* Remove border radius */
  box-shadow: none; /* Remove shadow */
}

/* Logo Container - Updated styles */
.logo-container {
  width: 100px;
  height: 100px;
  margin: 0 auto 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  border-radius: 50%;
  overflow: hidden;
  padding: 0;
  border: 2px solid #555; /* Subtle border */
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Typography */
h1 {
  font-size: 32px;
  font-weight: 300;
  letter-spacing: -1.5px;
  text-align: center;
  margin-bottom: 8px;
  color: #ffffff; /* White text */
}

.subtitle {
  text-align: center;
  color: #b0b0b0; /* Light gray for subtitle */
  font-size: 14px;
  margin-bottom: 32px;
}

/* Form */
.form {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-group {
  margin-bottom: 16px; /* Reduced spacing */
  width: 100%;
  max-width: 280px; /* Even smaller width */
  margin-left: auto;
  margin-right: auto;
}

.label {
  display: block;
  font-size: 12px;
  color: #b0b0b0; /* Light gray for labels */
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-field {
  width: 100%;
  padding: 10px 14px; /* Even smaller padding */
  border: 1px solid #555; /* Darker border */
  border-radius: 6px; /* Slightly smaller radius */
  font-size: 14px; /* Slightly smaller font */
  transition: all 0.2s;
  background: #404040; /* Dark input background */
  color: #ffffff; /* White text */
  margin: 0 auto; /* Center the input */
}

.input-field:focus {
  outline: none;
  border-color: #888; /* Lighter gray on focus */
  background: #484848;
}

.input-field:disabled {
  background: #2a2a2a;
  cursor: not-allowed;
  opacity: 0.6;
}

.input-field::placeholder {
  color: #808080; /* Gray placeholder */
}

/* Form Options */
.form-options {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
  width: 100%;
  max-width: 280px; /* Match input width */
  margin-left: auto;
  margin-right: auto;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #b0b0b0; /* Light gray text */
}

.checkbox {
  width: 16px;
  height: 16px;
  margin-left: 8px;
  cursor: pointer;
  accent-color: #ffffff; /* White checkbox accent */
}

.link-text {
  font-size: 14px;
  color: #b0b0b0; /* Light gray */
  text-decoration: none;
  transition: color 0.2s;
}

.link-text:hover {
  color: #ffffff; /* White on hover */
}

/* Buttons */
.btn {
  width: 100%;
  max-width: 280px; /* Match input width */
  padding: 12px 20px; /* Even smaller padding */
  border: none;
  border-radius: 6px; /* Match input radius */
  font-size: 14px; /* Match input font size */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 auto; /* Center the button */
}

.btn-primary {
  background: #ffffff; /* White button */
  color: #2a2a2a; /* Charcoal text */
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255,255,255,0.15);
  background: #f0f0f0;
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: #555;
  color: #999;
  cursor: not-allowed;
}

.btn-google {
  background: #404040; /* Dark gray for Google button */
  color: #ffffff;
  border: 1px solid #555;
}

.btn-google:hover:not(:disabled) {
  background: #484848;
  border-color: #666;
}

.btn-google:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
}

.google-icon {
  width: 20px;
  height: 20px;
}

/* Loading */
.loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
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
  margin: 32px 0;
}

.divider::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: #555; /* Dark gray divider */
}

.divider span {
  position: relative;
  background: #2a2a2a; /* Match main background for seamless look */
  padding: 0 20px;
  color: #808080; /* Gray text */
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Footer Link */
.footer-link {
  text-align: center;
  font-size: 14px;
  margin-top: 24px; /* Add some spacing */
}

.footer-link .link {
  color: #b0b0b0; /* Light gray to match other secondary text */
  text-decoration: none;
  font-weight: 400;
  transition: all 0.2s;
  display: inline-block;
}

.footer-link .link:hover {
  color: #ffffff; /* White on hover */
  text-decoration: underline;
}

/* Message */
.message {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
}

.message-error {
  background: rgba(239, 68, 68, 0.1); /* Dark red background */
  color: #ff6b6b; /* Light red text */
  border: 1px solid rgba(239, 68, 68, 0.3);
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
  .login-card {
    padding: 32px 24px;
  }

  h1 {
    font-size: 28px;
  }

  .logo-container {
    width: 80px;
    height: 80px;
  }

  .input-field {
    padding: 14px;
    font-size: 14px;
  }

  .btn {
    padding: 14px 20px;
    font-size: 15px;
  }

  .form-options {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}

/* RTL Support */
[dir="rtl"] .checkbox {
  margin-left: 0;
  margin-right: 8px;
}

[dir="rtl"] .footer-link .link {
  margin-right: 0;
  margin-left: 4px;
}
</style>