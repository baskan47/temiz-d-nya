import React, { useState } from 'react'
import theme from './theme'

/**
 * 🔔 Push Bildirim Sistemi
 */
const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'task_available',
      title: '✅ Yeni Görev Mevcut',
      message: 'Meles Deresi temizliği görevine katıl. +250 puan kazan!',
      time: '2 dakika önce',
      icon: '🎯',
      read: false,
      action: 'Göreve Katıl',
    },
    {
      id: 2,
      type: 'group_update',
      title: '👥 Grup Güncellemesi',
      message: 'Alsancak Temiz Gönüllüler grubuna yeni 5 üye katıldı',
      time: '15 dakika önce',
      icon: '👥',
      read: false,
      action: 'Grubu Gör',
    },
    {
      id: 3,
      type: 'achievement',
      title: '🏆 Başarı Açıldı',
      message: 'Çevre Kahramanı rozeti kazandın. 10 görev tamamlandı!',
      time: '1 saat önce',
      icon: '🏆',
      read: true,
      action: 'Rozeti Gör',
    },
    {
      id: 4,
      type: 'reward',
      title: '💰 Ödül Kazandı',
      message: 'Dün temizlediğin alan onaylandı. +150 puan eklendi',
      time: '3 saat önce',
      icon: '💰',
      read: true,
      action: 'Bakiye Gör',
    },
    {
      id: 5,
      type: 'update',
      title: '📰 Sistem Haberi',
      message: 'Yeni fotoğraf kanıt sistemi aktif hale geldi',
      time: '1 gün önce',
      icon: '📢',
      read: true,
      action: 'Detay',
    },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <h2 style={{ margin: 0, color: theme.colors.dark, fontSize: 20, fontWeight: 700 }}>
          🔔 Bildirimler
        </h2>
        {unreadCount > 0 && (
          <div style={{
            background: theme.colors.error,
            color: 'white',
            padding: '4px 12px',
            borderRadius: theme.radius.full,
            fontWeight: 700,
            fontSize: 12,
          }}>
            {unreadCount} Yeni
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: theme.spacing.md }}>
        {notifications.map(notif => (
          <NotificationItem
            key={notif.id}
            notification={notif}
            onRead={() => markAsRead(notif.id)}
          />
        ))}
      </div>
    </div>
  )
}

const NotificationItem = ({ notification, onRead }) => (
  <div
    onClick={onRead}
    style={{
      background: notification.read ? 'white' : theme.colors.primary + '10',
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      boxShadow: theme.shadows.sm,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      borderLeft: `4px solid ${notification.read ? 'transparent' : theme.colors.primary}`,
    }}
    onMouseOver={e => {
      e.currentTarget.style.transform = 'translateX(4px)'
    }}
    onMouseOut={e => {
      e.currentTarget.style.transform = 'translateX(0)'
    }}
  >
    <div style={{ display: 'flex', gap: theme.spacing.md }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: theme.radius.md,
        background: theme.colors.light,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        flexShrink: 0,
      }}>
        {notification.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          margin: 0,
          color: theme.colors.dark,
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 4,
        }}>
          {notification.title}
        </h4>
        <p style={{
          margin: 0,
          color: theme.colors.textSecondary,
          fontSize: 12,
          lineHeight: 1.4,
          marginBottom: 6,
        }}>
          {notification.message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#999' }}>
            {notification.time}
          </span>
          <button
            onClick={e => {
              e.stopPropagation()
              alert(`✅ ${notification.action}`)
            }}
            style={{
              background: theme.colors.primary + '20',
              color: theme.colors.primary,
              border: 'none',
              padding: '4px 12px',
              borderRadius: theme.radius.sm,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {notification.action}
          </button>
        </div>
      </div>
    </div>
  </div>
)

/**
 * 📸 Fotoğraf Kanıt Sistemi
 */
const PhotoProofSystem = () => {
  const [proofs, setProofs] = useState([
    {
      id: 1,
      task: 'Meles Deresi Temizliği',
      location: 'Alsancak, İzmir',
      uploadedBy: 'Ali Kaya',
      uploadTime: '2 dakika önce',
      status: 'pending',
      photos: 3,
      wasteWeight: '45kg',
      areaSize: '250m²',
    },
    {
      id: 2,
      task: 'Mithatpaşa Parkı Bakımı',
      location: 'Konak, İzmir',
      uploadedBy: 'Zeynep Yıldız',
      uploadTime: '1 saat önce',
      status: 'approved',
      photos: 2,
      wasteWeight: '25kg',
      areaSize: '180m²',
    },
    {
      id: 3,
      task: 'Alsancak Sokakları',
      location: 'Alsancak, İzmir',
      uploadedBy: 'Mehmet Çapar',
      uploadTime: '3 saat önce',
      status: 'approved',
      photos: 4,
      wasteWeight: '62kg',
      areaSize: '320m²',
    },
  ])

  const [showUploadModal, setShowUploadModal] = useState(false)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <h2 style={{ margin: 0, color: theme.colors.dark, fontSize: 20, fontWeight: 700 }}>
          📸 Fotoğraf Kanıtları
        </h2>
        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            background: theme.colors.primary,
            color: 'white',
            border: 'none',
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderRadius: theme.radius.md,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ➕ Yükle
        </button>
      </div>

      <div style={{ display: 'grid', gap: theme.spacing.lg }}>
        {proofs.map(proof => (
          <ProofCard
            key={proof.id}
            proof={proof}
          />
        ))}
      </div>

      {showUploadModal && (
        <UploadProofModal
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  )
}

const ProofCard = ({ proof }) => (
  <div style={{
    background: 'white',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadows.md,
    borderLeft: `4px solid ${
      proof.status === 'approved' ? theme.colors.success : theme.colors.warning
    }`,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
      <div>
        <h3 style={{ margin: 0, color: theme.colors.dark, fontSize: 16, fontWeight: 700 }}>
          {proof.task}
        </h3>
        <p style={{ margin: '4px 0 0 0', color: theme.colors.textSecondary, fontSize: 12 }}>
          📍 {proof.location}
        </p>
      </div>
      <div style={{
        background: proof.status === 'approved' ? '#51CF6620' : '#FFA94D20',
        color: proof.status === 'approved' ? '#51CF66' : '#FFA94D',
        padding: '4px 12px',
        borderRadius: theme.radius.sm,
        fontSize: 11,
        fontWeight: 700,
      }}>
        {proof.status === 'approved' ? '✅ Onaylandı' : '⏳ Beklemede'}
      </div>
    </div>

    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: theme.spacing.sm,
      padding: `${theme.spacing.md} 0`,
      borderTop: `1px solid ${theme.colors.light}`,
      borderBottom: `1px solid ${theme.colors.light}`,
      marginBottom: theme.spacing.md,
    }}>
      <ProofStat emoji="📸" label="Fotoğraf" value={proof.photos} />
      <ProofStat emoji="⚖️" label="Atık" value={proof.wasteWeight} />
      <ProofStat emoji="📐" label="Alan" value={proof.areaSize} />
    </div>

    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 12,
      color: theme.colors.textSecondary,
    }}>
      <span>
        👤 {proof.uploadedBy} · {proof.uploadTime}
      </span>
      <button
        style={{
          background: theme.colors.primary + '20',
          color: theme.colors.primary,
          border: 'none',
          padding: '4px 12px',
          borderRadius: theme.radius.sm,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        👁️ Görüntüle
      </button>
    </div>
  </div>
)

const ProofStat = ({ emoji, label, value }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 16, marginBottom: 2 }}>{emoji}</div>
    <div style={{ fontSize: 10, color: theme.colors.textSecondary }}>
      {label}
    </div>
    <div style={{ fontSize: 13, fontWeight: 700, color: theme.colors.primary, marginTop: 2 }}>
      {value}
    </div>
  </div>
)

const UploadProofModal = ({ onClose }) => (
  <>
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 999,
      }}
      onClick={onClose}
    />
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      borderRadius: `${theme.radius.lg} ${theme.radius.lg} 0 0`,
      padding: theme.spacing.xl,
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 1000,
    }}>
      <h2 style={{ margin: '0 0 ' + theme.spacing.lg + ' 0', color: theme.colors.dark }}>
        📸 Fotoğraf Kanıtı Yükle
      </h2>

      <div style={{
        background: theme.colors.light,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.md,
        marginBottom: theme.spacing.lg,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      onMouseOver={e => e.currentTarget.style.background = theme.colors.light + 'CC'}
      onMouseOut={e => e.currentTarget.style.background = theme.colors.light}>
        <div style={{ fontSize: 32, marginBottom: theme.spacing.md }}>📷</div>
        <p style={{ margin: 0, color: theme.colors.dark, fontWeight: 700 }}>
          Fotoğraf Seç veya Çek
        </p>
        <p style={{ margin: '4px 0 0 0', color: theme.colors.textSecondary, fontSize: 12 }}>
          En az 2 fotoğraf gereklidir
        </p>
      </div>

      <div style={{ marginBottom: theme.spacing.lg }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: theme.colors.dark }}>
          Görevi Seç
        </label>
        <select style={{
          width: '100%',
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.light}`,
          fontFamily: theme.typography.fonts.main,
          boxSizing: 'border-box',
        }}>
          <option>Meles Deresi Temizliği</option>
          <option>Mithatpaşa Parkı Bakımı</option>
          <option>Alsancak Sokakları</option>
        </select>
      </div>

      <textarea
        placeholder="Çalışmanız hakkında açıklama yazın..."
        rows={3}
        style={{
          width: '100%',
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.light}`,
          marginBottom: theme.spacing.lg,
          fontFamily: theme.typography.fonts.main,
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', gap: theme.spacing.md }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: theme.spacing.md,
            background: theme.colors.light,
            border: 'none',
            borderRadius: theme.radius.md,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          İptal
        </button>
        <button
          onClick={() => {
            alert('✅ Fotoğraf kanıtı başarıyla yüklendi!\n⏳ Onay için beklemede...')
            onClose()
          }}
          style={{
            flex: 1,
            padding: theme.spacing.md,
            background: theme.colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: theme.radius.md,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ✅ Yükle
        </button>
      </div>
    </div>
  </>
)

export { NotificationCenter, PhotoProofSystem }
