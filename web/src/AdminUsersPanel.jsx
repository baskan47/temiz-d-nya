import React, { useEffect, useState } from 'react'
import { watchAllUsers, watchUserCleanups, watchUserPhotos, verifyUser } from './firestoreService'
import { doc, updateDoc } from 'firebase/firestore'

export default function AdminUsersPanel() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [cleanups, setCleanups] = useState([])
  const [photos, setPhotos] = useState([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'verified', 'pending'
  const [activeSubTab, setActiveSubTab] = useState('cleanups') // 'cleanups', 'photos'
  const [firebaseConnected, setFirebaseConnected] = useState(!!window.firebaseConnected)

  useEffect(() => {
    function handleReady() {
      setFirebaseConnected(true)
    }
    if (window.firebaseConnected) {
      setFirebaseConnected(true)
    }
    document.addEventListener('firebase-ready', handleReady)
    return () => document.removeEventListener('firebase-ready', handleReady)
  }, [])

  useEffect(() => {
    if (firebaseConnected && window.firestore) {
      const unsub = watchAllUsers(window.firestore, (data) => {
        setUsers(data)
        // Keep selected user reference fresh
        if (selectedUser) {
          const updated = data.find(u => u.id === selectedUser.id)
          if (updated) setSelectedUser(updated)
        }
      })
      return () => unsub && unsub()
    }
  }, [firebaseConnected])

  useEffect(() => {
    if (firebaseConnected && window.firestore && selectedUser) {
      const unsubCleanups = watchUserCleanups(window.firestore, selectedUser.id, setCleanups)
      const unsubPhotos = watchUserPhotos(window.firestore, selectedUser.id, setPhotos)
      
      return () => {
        unsubCleanups && unsubCleanups()
        unsubPhotos && unsubPhotos()
      }
    } else {
      setCleanups([])
      setPhotos([])
    }
  }, [selectedUser?.id, firebaseConnected])

  async function handleVerify(userId, name) {
    if (!window.firestore) return alert('Firebase bağlantısı yok')
    const confirmed = window.confirm(`${name} kullanıcısını doğrulamak istediğinizden emin misiniz?`)
    if (!confirmed) return

    try {
      await verifyUser(window.firestore, userId)
      alert('Kullanıcı başarıyla doğrulandı!')
    } catch (e) {
      alert('Hata oluştu: ' + e.message)
    }
  }

  async function handleUnverify(userId, name) {
    if (!window.firestore) return alert('Firebase bağlantısı yok')
    const confirmed = window.confirm(`${name} kullanıcısının doğrulamasını kaldırmak istediğinizden emin misiniz?`)
    if (!confirmed) return

    try {
      const userDocRef = doc(window.firestore, 'users', userId)
      await updateDoc(userDocRef, {
        verified: false,
        verifiedAt: null
      })
      alert('Doğrulama başarıyla kaldırıldı!')
    } catch (e) {
      alert('Hata oluştu: ' + e.message)
    }
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

  // Filter users
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = 
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.surname && user.surname.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.shortId && user.shortId.toLowerCase().includes(query))

    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'verified' ? user.verified === true :
      statusFilter === 'pending' ? user.verified !== true

    return matchesSearch && matchesStatus
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', height: 'calc(100vh - 120px)', minHeight: '550px' }}>
      
      {/* LEFT PANEL: USER LIST */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', overflow: 'hidden', height: '100%' }}>
        <h4 style={{ margin: '0 0 12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Kayıtlı Kullanıcılar</span>
          <span style={{ fontSize: '12px', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
            {filteredUsers.length}
          </span>
        </h4>

        {/* Search & Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          <input 
            type="text" 
            placeholder="İsim, email veya ID ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => setStatusFilter('all')}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '11px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === 'all' ? 'var(--primary)' : '#e5e7eb',
                color: statusFilter === 'all' ? 'white' : '#374151',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              Tümü
            </button>
            <button 
              onClick={() => setStatusFilter('verified')}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '11px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === 'verified' ? 'var(--success)' : '#e5e7eb',
                color: statusFilter === 'verified' ? 'white' : '#374151',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              Onaylı
            </button>
            <button 
              onClick={() => setStatusFilter('pending')}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '11px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === 'pending' ? 'var(--warning)' : '#e5e7eb',
                color: statusFilter === 'pending' ? 'white' : '#374151',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              Bekleyen
            </button>
          </div>
        </div>

        {/* User list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Kullanıcı bulunamadı.
            </div>
          ) : (
            filteredUsers.map(user => {
              const isSelected = selectedUser?.id === user.id
              const fullName = `${user.name || ''} ${user.surname || ''}`.trim() || 'İsimsiz Gönüllü'
              return (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(27, 110, 79, 0.05)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dark)' }}>
                      {fullName}
                    </span>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: user.verified ? 'var(--success)' : 'var(--warning)'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>{user.shortId || `#${user.id.substring(0,6)}`}</span>
                    <span>{user.email ? user.email.substring(0, 18) + (user.email.length > 18 ? '..' : '') : '-'}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: USER DETAILS & TABS */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'hidden', height: '100%' }}>
        {selectedUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            
            {/* Header info block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  {selectedUser.name ? selectedUser.name[0].toUpperCase() : 'G'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--dark)' }}>
                    {selectedUser.name || ''} {selectedUser.surname || ''}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '10px', marginTop: '2px' }}>
                    <span>Gönüllü Kodu: <strong>{selectedUser.shortId || '-'}</strong></span>
                    <span>•</span>
                    <span>Rol: <strong style={{ textTransform: 'capitalize' }}>{selectedUser.role || 'volunteer'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div>
                {selectedUser.verified ? (
                  <button 
                    onClick={() => handleUnverify(selectedUser.id, selectedUser.name)}
                    style={{
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fca5a5',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Onayı Kaldır
                  </button>
                ) : (
                  <button 
                    onClick={() => handleVerify(selectedUser.id, selectedUser.name)}
                    style={{
                      background: 'var(--success)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    Kullanıcıyı Onayla
                  </button>
                )}
              </div>
            </div>

            {/* Profile fields grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              marginBottom: '16px'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>E-posta Adresi</span>
                <span style={{ fontSize: '13px', fontWeight: 500, wordBreak: 'break-all' }}>{selectedUser.email || '-'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Telefon Numarası</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{selectedUser.phone || selectedUser.phoneNumber || '-'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Yaş</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{selectedUser.age || '-'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>T.C. Kimlik No</span>
                <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'monospace' }}>{selectedUser.idNumber || '-'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Eco Points</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>{selectedUser.ecoPoints || 0}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Kayıt Tarihi</span>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>{formatDate(selectedUser.createdAt)}</span>
              </div>
            </div>

            {/* Tabs Selector */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
              <button
                onClick={() => setActiveSubTab('cleanups')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeSubTab === 'cleanups' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeSubTab === 'cleanups' ? 'var(--primary)' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Temizlik Çalışmaları ({cleanups.length})
              </button>
              <button
                onClick={() => setActiveSubTab('photos')}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeSubTab === 'photos' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeSubTab === 'photos' ? 'var(--primary)' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Eklediği Görseller ({photos.length})
              </button>
            </div>

            {/* Tab contents (scrollable container) */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {activeSubTab === 'cleanups' ? (
                <div>
                  {cleanups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      Henüz tamamlanmış temizlik çalışması bulunmamaktadır.
                    </div>
                  ) : (
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th>Tarih</th>
                          <th>Toplanan Miktar (Ağırlık)</th>
                          <th>Zorluk / Aciliyet</th>
                          <th>Kazanılan Puan</th>
                          <th>Fotoğraf Doğrulama</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cleanups.map((session) => (
                          <tr key={session.id}>
                            <td>{formatDate(session.createdAt)}</td>
                            <td>{session.weight ? `${session.weight} kg` : '-'}</td>
                            <td>{`Z: ${session.difficulty || '-'} / A: ${session.urgency || '-'}`}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                              +{session.earnedPoints || 0}
                            </td>
                            <td>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: session.photoVerified ? '#e8f5e9' : '#fff3e0',
                                color: session.photoVerified ? '#2e7d32' : '#e65100'
                              }}>
                                {session.photoVerified ? 'Onaylı' : 'Doğrulanmamış'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div>
                  {photos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      Yüklenmiş görsel bulunmamaktadır.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                      {photos.map((photo) => (
                        <div 
                          key={photo.id}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#ffffff',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <div style={{ height: '120px', overflow: 'hidden', background: '#e2e8f0', position: 'relative' }}>
                            <img 
                              src={photo.photoUrl} 
                              alt="Verifications" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.src = 'https://picsum.photos/seed/error/200/120'
                              }}
                            />
                            <span style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              background: 
                                photo.status === 'approved' ? 'var(--success)' :
                                photo.status === 'rejected' ? 'var(--error)' : 'var(--warning)',
                              color: 'white'
                            }}>
                              {photo.status === 'approved' ? 'Onaylı' : 
                               photo.status === 'rejected' ? 'Red' : 'İncelemede'}
                            </span>
                          </div>
                          <div style={{ padding: '8px', fontSize: '12px' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginBottom: '4px' }}>
                              {formatDate(photo.createdAt)}
                            </div>
                            <div style={{ fontWeight: 500, height: '36px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {photo.description || 'Açıklama yok'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
            <h3>Detayları Görüntülemek İçin Kullanıcı Seçin</h3>
            <p style={{ maxWidth: '300px', fontSize: '14px' }}>
              Soldaki listeden bir gönüllü seçerek profil detaylarını, tamamladığı seansları ve yüklediği görselleri yönetebilirsiniz.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
