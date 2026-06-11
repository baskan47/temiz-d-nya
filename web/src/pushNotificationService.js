// Push Notification Servisi - Yeni etkinlikler için anlık bildirimler
import { appName } from './config'

const NOTIF_TAG = (appName || 'temiz-dunya').toLowerCase().replace(/\s+/g, '-') + '-notification'

// Bildirim izni isteme
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('⚠️ Bu tarayıcı bildirimleri desteklemiyor')
    return false
  }

  if (Notification.permission === 'granted') {
    console.log(`[${appName}] ✅ Bildirim izni zaten verilmiş`)
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      console.log(`[${appName}] ✅ Bildirim izni verildi`)
      showNotification('Hoş Geldiniz!', {
        body: 'Yakınınızda yeni etkinlikler başladığında bildirim alacaksınız.',
        icon: '🌱'
      })
      return true
    }
  }

  console.log(`[${appName}] ❌ Bildirim izni reddedildi`)
  return false
}

// Bildirim gösterme
export function showNotification(title, options = {}) {
  if (Notification.permission === 'granted') {
    const defaultOptions = {
      icon: '/icon.png',
      badge: '/badge.png',
      vibrate: [200, 100, 200],
      tag: NOTIF_TAG,
      requireInteraction: false,
      ...options
    }

    const notification = new Notification(title, defaultOptions)

    notification.onclick = function(event) {
      event.preventDefault()
      window.focus()
      if (options.onClick) {
        options.onClick()
      }
      notification.close()
    }

    return notification
  }
  return null
}

// Yeni etkinlik bildirimi
export function notifyNewEvent(event) {
  showNotification('🎯 Yeni Etkinlik!', {
    body: `${event.title} - ${event.location}\n🎁 Ödül: ${event.reward}`,
    icon: '🌳',
    requireInteraction: true,
    onClick: () => {
      // Etkinlik sayfasına yönlendir
      window.location.href = '/events'
    }
  })
}

// Acil durum bildirimi
export function notifyEmergency(data) {
  showNotification('🚨 ACİL DURUM!', {
    body: `${data.location} bölgesinde acil temizlik gerekiyor!\nYoğunluk: ${data.intensity}/5`,
    icon: '🚨',
    vibrate: [500, 200, 500, 200, 500],
    requireInteraction: true,
    onClick: () => {
      window.location.href = '/emergency'
    }
  })
}

// Temizlik hatırlatıcısı
export function notifyCleaningReminder() {
  showNotification('⏰ Hatırlatma', {
    body: 'Başlattığınız temizlik işlemi devam ediyor. Bittiğinde "Sonrası" fotoğrafını çekmeyi unutmayın!',
    icon: '🧹'
  })
}

// Puan kazanma bildirimi
export function notifyPointsEarned(points) {
  showNotification('🎉 Tebrikler!', {
    body: `${points} puan kazandınız! Toplam puanınızı görmek için sıralama sayfasına gidin.`,
    icon: '⭐'
  })
}

// Ödül kazanma bildirimi
export function notifyRewardEarned(reward) {
  showNotification('💰 Ödül Kazandınız!', {
    body: `${reward} kazandınız! Tebrikler! 🎊`,
    icon: '💵',
    vibrate: [300, 100, 300, 100, 300]
  })
}

// Periyodik bildirim ayarlama (örn: haftalık özet)
export function scheduleWeeklySummary() {
  // Service Worker ile periyodik bildirimler
  if ('serviceWorker' in navigator && 'periodicSync' in navigator.serviceWorker) {
    navigator.serviceWorker.ready.then(registration => {
      return registration.periodicSync.register('weekly-summary', {
        minInterval: 7 * 24 * 60 * 60 * 1000 // 1 hafta
      })
    }).then(() => {
      console.log('✅ Haftalık özet bildirimi ayarlandı')
    }).catch(err => {
      console.log('❌ Periyodik bildirim hatası:', err)
    })
  }
}

// Konum bazlı bildirim (yakındaki etkinlikler)
export async function checkNearbyEvents(userLocation) {
  // API'den yakındaki etkinlikleri çek
  // Bu fonksiyon periyodik olarak çalıştırılmalı (örn: her 30 dakikada bir)
  
  try {
    // Simülasyon - gerçek uygulamada API çağrısı yapılacak
    const nearbyEvents = [
      {
        id: 1,
        title: 'Park Temizliği',
        location: 'Kuğulu Park',
        distance: 500, // metre
        reward: '500 TL'
      }
    ]

    // 1 km içindeki etkinlikleri bildir
    nearbyEvents.forEach(event => {
      if (event.distance < 1000) {
        notifyNewEvent(event)
      }
    })
  } catch (error) {
    console.error('❌ Yakındaki etkinlikler kontrol edilemedi:', error)
  }
}

// Bildirim ayarlarını kaydetme
export function saveNotificationSettings(settings) {
  localStorage.setItem('notification_settings', JSON.stringify(settings))
}

// Bildirim ayarlarını getirme
export function getNotificationSettings() {
  const settings = localStorage.getItem('notification_settings')
  return settings ? JSON.parse(settings) : {
    newEvents: true,
    emergencies: true,
    rewards: true,
    reminders: true,
    weeklySummary: true
  }
}

// Bildirim durumunu kontrol etme
export function isNotificationEnabled() {
  return Notification.permission === 'granted'
}
