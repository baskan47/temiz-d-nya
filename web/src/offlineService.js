// Çevrimdışı Mod Servisi - İnternet olmadan fotoğraf ve veri kaydetme
import { appName } from './config'

const OFFLINE_STORAGE_KEY = (appName || 'temiz dunya').toLowerCase().replace(/\s+/g, '_') + '_offline_data'

// Çevrimdışı veri kaydetme
export function saveOfflineData(data) {
  try {
    const existingData = getOfflineData()
    existingData.push({
      ...data,
      timestamp: Date.now(),
      synced: false
    })
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(existingData))
    console.log(`[${appName}] ✅ Veri çevrimdışı olarak kaydedildi`)
    return true
  } catch (error) {
    console.error(`[${appName}] ❌ Çevrimdışı veri kaydetme hatası:`, error)
    return false
  }
}

// Çevrimdışı verileri getirme
export function getOfflineData() {
  try {
    const data = localStorage.getItem(OFFLINE_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error(`[${appName}] ❌ Çevrimdışı veri okuma hatası:`, error)
    return []
  }
}

// İnternet bağlantısı kontrolü
export function isOnline() {
  return navigator.onLine
}

// Çevrimdışı verileri senkronize etme
export async function syncOfflineData(uploadFunction) {
  if (!isOnline()) {
    console.log(`[${appName}] ⚠️ İnternet bağlantısı yok, senkronizasyon yapılamıyor`)
    return false
  }

  const offlineData = getOfflineData()
  const unsyncedData = offlineData.filter(item => !item.synced)

  if (unsyncedData.length === 0) {
    console.log('✅ Senkronize edilecek veri yok')
    return true
  }

  console.log(`🔄 ${unsyncedData.length} veri senkronize ediliyor...`)

  try {
    for (let i = 0; i < unsyncedData.length; i++) {
      const item = unsyncedData[i]
      await uploadFunction(item)
      
      // Başarılı yükleme sonrası synced işaretle
      const allData = getOfflineData()
      const index = allData.findIndex(d => d.timestamp === item.timestamp)
      if (index !== -1) {
        allData[index].synced = true
        localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(allData))
      }
    }
    
    console.log(`[${appName}] ✅ Tüm veriler başarıyla senkronize edildi`)
    
    // Senkronize edilmiş verileri temizle (isteğe bağlı)
    clearSyncedData()
    return true
  } catch (error) {
    console.error(`[${appName}] ❌ Senkronizasyon hatası:`, error)
    return false
  }
}

// Senkronize edilmiş verileri temizle
export function clearSyncedData() {
  try {
    const offlineData = getOfflineData()
    const unsyncedData = offlineData.filter(item => !item.synced)
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(unsyncedData))
    console.log(`[${appName}] 🧹 Senkronize edilmiş veriler temizlendi`)
  } catch (error) {
    console.error(`[${appName}] ❌ Temizleme hatası:`, error)
  }
}

// İnternet bağlantısı değişikliklerini izle
export function watchConnectionStatus(onOnline, onOffline) {
  window.addEventListener('online', () => {
    console.log(`[${appName}] 🌐 İnternet bağlantısı kuruldu`)
    if (onOnline) onOnline()
  })

  window.addEventListener('offline', () => {
    console.log(`[${appName}] 📵 İnternet bağlantısı kesildi`)
    if (onOffline) onOffline()
  })
}

// Fotoğraf Base64'e çevirme (çevrimdışı depolama için)
export async function photoToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

// GPS konumu alma (çevrimdışı da çalışır)
export async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation desteklenmiyor'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
      },
      error => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  })
}
