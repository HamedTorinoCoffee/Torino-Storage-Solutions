// composables/useBarcodeScanner.ts
import { ref, readonly } from 'vue'
import { Capacitor } from '@capacitor/core'
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning'
import { useNuxtApp } from '#imports'
import { useAuth } from './useAuth'

export function useBarcodeScanner() {
  const isScanning = ref(false)
  const nuxtApp    = useNuxtApp()
  // casting injected db to Firestore type
  const db         = nuxtApp.$db as Firestore
  const { user }   = useAuth()

  async function startScan() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('اسکن فقط روی موبایل قابل اجراست')
    }
    isScanning.value = true

    // بررسی پشتیبانی و درخواست دسترسی
    const { supported } = await BarcodeScanner.isSupported()
    if (!supported) {
      isScanning.value = false
      throw new Error('این دستگاه اسکن بارکد را پشتیبانی نمی‌کند')
    }
    const { camera } = await BarcodeScanner.requestPermissions()
    if (camera !== 'granted' && camera !== 'limited') {
      isScanning.value = false
      throw new Error('دسترسی دوربین لازم است')
    }

    // انجام اسکن
    const result = await BarcodeScanner.scan({
      formats: [
        BarcodeFormat.QrCode,
        BarcodeFormat.Ean13,
        BarcodeFormat.Code128
      ]
    })
    isScanning.value = false

    const barcodes = result?.barcodes ?? []
    if (barcodes.length === 0) {
      return null
    }
    // non-null assertion since we checked length
    const b = barcodes[0]!

    // ذخیره در Firestore
    if (user.value) {
      await addDoc(collection(db, 'scans'), {
        userId:           user.value.uid,
        userEmail:        user.value.email,
        content:          b.rawValue,
        format:           b.format,
        scanTime:         serverTimestamp(),
        scanTimeGregorian: new Date().toISOString()
      })
    }

    return b
  }

  return {
    isScanning: readonly(isScanning),
    startScan
  }
}
