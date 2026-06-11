// Notification service for email alerts
// This can integrate with SendGrid, Mailgun, or a custom webhook
import { collection, doc, addDoc, query, where, orderBy, onSnapshot, updateDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore'

const WEBHOOK_URL = import.meta.env.VITE_EMAIL_WEBHOOK_URL || ''

/**
 * Send notification email via webhook
 * @param {Object} params - Notification parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.message - Email message
 * @param {string} params.type - Notification type (verification, alert, etc.)
 */
export async function sendEmailNotification({ to, subject, message, type = 'general' }) {
  if (!WEBHOOK_URL) {
    console.warn('Email webhook URL not configured')
    return { success: false, error: 'Webhook not configured' }
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        message,
        type,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`)
    }

    const data = await response.json()
    console.log('Email notification sent:', type, to)
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send verification approval notification
 */
export async function notifyVerificationApproved(userEmail, userName) {
  return sendEmailNotification({
    to: userEmail,
    subject: 'Hesabınız Onaylandı - Belediye Gönüllü Sistemi',
    message: `
      Merhaba ${userName},
      
      Belediye gönüllü sistemi hesabınız başarıyla onaylandı!
      
      Artık sisteme giriş yaparak:
      - Raporları görüntüleyebilir
      - Gönüllü gruplarına katılabilir
      - Topluluk için katkıda bulunabilirsiniz
      
      Katılımınız için teşekkür ederiz!
      
      Belediye Gönüllü Sistemi
    `,
    type: 'verification_approved'
  })
}

/**
 * Send verification rejection notification
 */
export async function notifyVerificationRejected(userEmail, userName, reason) {
  return sendEmailNotification({
    to: userEmail,
    subject: 'Hesap Onayı Hakkında - Belediye Gönüllü Sistemi',
    message: `
      Merhaba ${userName},
      
      Belediye gönüllü sistemi başvurunuz incelendi.
      
      ${reason ? `Sebep: ${reason}` : 'Daha fazla bilgi için lütfen belediye ile iletişime geçin.'}
      
      Tekrar başvurmak isterseniz, lütfen doğru bilgilerle kaydolun.
      
      Belediye Gönüllü Sistemi
    `,
    type: 'verification_rejected'
  })
}

/**
 * Send group invitation notification
 */
export async function notifyGroupInvitation(userEmail, groupName, inviterName) {
  return sendEmailNotification({
    to: userEmail,
    subject: `Grup Daveti: ${groupName}`,
    message: `
      Merhaba,
      
      ${inviterName} sizi "${groupName}" gönüllü grubuna davet etti!
      
      Sisteme giriş yaparak daveti kabul edebilirsiniz.
      
      Belediye Gönüllü Sistemi
    `,
    type: 'group_invitation'
  })
}

/**
 * Send emergency alert notification
 */
export async function notifyEmergencyAlert(userEmail, alertType, location) {
  return sendEmailNotification({
    to: userEmail,
    subject: `Acil Durum: ${alertType}`,
    message: `
      ACİL DURUM BİLDİRİMİ
      
      Tür: ${alertType}
      Konum: ${location}
      Zaman: ${new Date().toLocaleString('tr-TR')}
      
      Lütfen gerekli önlemleri alın.
      
      Belediye Gönüllü Sistemi
    `,
    type: 'emergency_alert'
  })
}

/**
 * Send report status update notification
 */
export async function notifyReportStatusUpdate(userEmail, reportId, status) {
  return sendEmailNotification({
    to: userEmail,
    subject: 'Rapor Durumu Güncellendi',
    message: `
      Merhaba,
      
      Raporunuz (#${reportId}) güncellendi.
      
      Yeni durum: ${status}
      
      Detaylar için sisteme giriş yapabilirsiniz.
      
      Belediye Gönüllü Sistemi
    `,
    type: 'report_update'
  })
}

/**
 * Bulk notification for multiple recipients
 */
export async function sendBulkNotifications(notifications) {
  const results = await Promise.allSettled(
    notifications.map(notif => sendEmailNotification(notif))
  )
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  const failed = results.length - successful
  
  console.log(`Bulk notification results: ${successful} successful, ${failed} failed`)
  
  return { successful, failed, results }
}

// Browser notification support (optional)
export function requestBrowserNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Browser notification permission:', permission)
    })
  }
}

export function showBrowserNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options
    })
  }
}

// DB Notification Services for testing/app integration
export async function sendNotification(payload) {
  let db = window.firestore;
  if (!payload || !payload.title || !payload.message) {
    throw new Error('Title and message are required');
  }
  const cleanData = {
    ...payload,
    read: false,
    timestamp: new Date(),
  };
  const ref = await addDoc(collection(db, 'notifications'), cleanData);
  return { id: ref.id };
}

export function subscribeToNotifications(userId, callback) {
  const db = window.firestore;
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(notifs);
  }, (error) => {
    console.error('subscribeToNotifications error:', error);
  });
}

export async function markAsRead(notificationId) {
  const db = window.firestore;
  const docRef = doc(db, 'notifications', notificationId);
  await updateDoc(docRef, { read: true });
}

export async function deleteNotification(notificationId) {
  const db = window.firestore;
  const docRef = doc(db, 'notifications', notificationId);
  await deleteDoc(docRef);
}

export async function getUnreadCount(userId) {
  const db = window.firestore;
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  // Filter client-side too (mock compatibility — where() may not filter in tests)
  return snap.docs.filter(d => d.data().read !== true).length;
}

export async function clearAllNotifications(userId) {
  const db = window.firestore;
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.delete(d.ref);
  });
  await batch.commit();
}
