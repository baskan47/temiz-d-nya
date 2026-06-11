import React, { useEffect, useState } from 'react'
import { watchPendingUsers, verifyUser } from './firestoreService'
import { notifyVerificationApproved, notifyVerificationRejected } from './notificationService'

export default function AdminVerification() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  useEffect(() => {
    if (window.firestore) {
      const unsub = watchPendingUsers(window.firestore, setUsers)
      return () => unsub && unsub()
    }
    setUsers([])
  }, [])

  async function handleApprove(user) {
    if (!window.firestore) return alert('Firebase bağlantısı yok')
    
    const confirmed = window.confirm(
      `${user.name} ${user.surname} kullanıcısını onaylamak istediğinizden emin misiniz?`
    )
    
    if (!confirmed) return

    try {
      await verifyUser(window.firestore, user.id, true)
      
      // Send approval notification
      if (user.email) {
        await notifyVerificationApproved(user.email, `${user.name} ${user.surname}`)
      }
      
      alert('Kullanıcı başarıyla onaylandı!')
    } catch (error) {
      console.error('Approval error:', error)
      alert('Onaylama hatası: ' + error.message)
    }
  }

  async function handleReject(user) {
    setSelectedUser(user)
    setShowRejectModal(true)
  }

  async function confirmReject() {
    if (!window.firestore || !selectedUser) return

    try {
      // Delete user or mark as rejected
      await window.firestore.collection('users').doc(selectedUser.id).update({
        verified: false,
        rejected: true,
        rejectionReason,
        rejectedAt: new Date()
      })

      // Send rejection notification
      if (selectedUser.email) {
        await notifyVerificationRejected(
          selectedUser.email,
          `${selectedUser.name} ${selectedUser.surname}`,
          rejectionReason
        )
      }

      setShowRejectModal(false)
      setSelectedUser(null)
      setRejectionReason('')
      alert('Kullanıcı reddedildi')
    } catch (error) {
      console.error('Rejection error:', error)
      alert('Reddetme hatası: ' + error.message)
    }
  }

  function getInitials(name, surname) {
    return `${name?.[0] || ''}${surname?.[0] || ''}`.toUpperCase()
  }

  function formatDate(timestamp) {
    if (!timestamp) return '-'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0 }}>Kimlik Doğrulama Bekleyen Kullanıcılar</h4>
        <div style={{
          background: '#fef3c7',
          color: '#92400e',
          padding: '4px 12px',
          borderRadius: 16,
          fontSize: 14,
          fontWeight: 600
        }}>
          {users.length} beklemede
        </div>
      </div>

      {users.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: '#9ca3af'
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
          <div>Bekleyen kullanıcı yok</div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {users.map(user => (
          <div
            key={user.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 16,
              background: '#fafafa',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'start' }}>
              {/* Avatar */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 24,
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {getInitials(user.name, user.surname)}
              </div>

              {/* User Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: 18 }}>
                      {user.name} {user.surname}
                    </h4>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      Kayıt: {formatDate(user.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                  marginTop: 12,
                  padding: 12,
                  background: 'white',
                  borderRadius: 8
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>📧 Email</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{user.email || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>📱 Telefon</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{user.phone || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>🎂 Yaş</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{user.age || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>🆔 Kimlik No</div>
                    <div style={{ fontSize: 14, fontWeight: 500, fontFamily: 'monospace' }}>
                      {user.idNumber || '-'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => handleApprove(user)}
                    style={{
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    ✓ Onayla
                  </button>
                  <button
                    onClick={() => handleReject(user)}
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    ✗ Reddet
                  </button>
                  <button
                    onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                    style={{
                      background: '#6b7280',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                  >
                    {selectedUser?.id === user.id ? '▲' : '▼'}
                  </button>
                </div>

                {/* Expanded Details */}
                {selectedUser?.id === user.id && (
                  <div style={{
                    marginTop: 12,
                    padding: 12,
                    background: '#f3f4f6',
                    borderRadius: 8,
                    fontSize: 13
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Ek Bilgiler:</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div><strong>User ID:</strong> {user.id}</div>
                      <div><strong>Rol:</strong> {user.role || 'volunteer'}</div>
                      <div><strong>Durum:</strong> {user.verified ? '✓ Onaylı' : '⏳ Beklemede'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ marginTop: 0 }}>Kullanıcıyı Reddet</h3>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>
              {selectedUser?.name} {selectedUser?.surname} - Reddetme sebebini belirtin:
            </p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Reddetme sebebi (opsiyonel)"
              style={{
                width: '100%',
                minHeight: 100,
                padding: 12,
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={confirmReject}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Reddet
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedUser(null)
                  setRejectionReason('')
                }}
                style={{
                  background: '#6b7280',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
