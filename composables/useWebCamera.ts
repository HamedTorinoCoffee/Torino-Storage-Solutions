// composables/useWebCamera.ts
import { ref, readonly, onUnmounted } from 'vue'
import { BrowserMultiFormatReader, DecodeHintType } from '@zxing/library'

export function useWebCamera() {
  const isScanning = ref(false)
  const hasPermission = ref(false)
  const error = ref<string | null>(null)
  const stream = ref<MediaStream | null>(null)
  
  let codeReader: BrowserMultiFormatReader | null = null
  let videoElement: HTMLVideoElement | null = null

  async function requestCameraPermission(): Promise<boolean> {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera
        } 
      })
      hasPermission.value = true
      stream.value = mediaStream
      return true
    } catch (err) {
      error.value = 'دسترسی به دوربین رد شد'
      hasPermission.value = false
      return false
    }
  }

  async function startScan(videoEl: HTMLVideoElement): Promise<string | null> {
    if (!hasPermission.value) {
      const granted = await requestCameraPermission()
      if (!granted) return null
    }

    isScanning.value = true
    videoElement = videoEl
    error.value = null

    try {
      codeReader = new BrowserMultiFormatReader()
      
      // Configure hints for better scanning
      const hints = new Map()
      hints.set(DecodeHintType.TRY_HARDER, true)
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        'QR_CODE',
        'EAN_13',
        'EAN_8', 
        'CODE_128',
        'CODE_39',
        'UPC_A',
        'UPC_E'
      ])

      const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoEl)
      return result.getText()
      
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        error.value = 'کدی شناسایی نشد'
      } else {
        error.value = `خطا در اسکن: ${err.message}`
      }
      return null
    } finally {
      isScanning.value = false
    }
  }

  function stopScan() {
    if (codeReader) {
      codeReader.reset()
      codeReader = null
    }
    
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
      stream.value = null
    }
    
    isScanning.value = false
    hasPermission.value = false
  }

  // Check if camera is supported
  function isCameraSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopScan()
  })

  return {
    isScanning: readonly(isScanning),
    hasPermission: readonly(hasPermission),
    error: readonly(error),
    requestCameraPermission,
    startScan,
    stopScan,
    isCameraSupported
  }
}