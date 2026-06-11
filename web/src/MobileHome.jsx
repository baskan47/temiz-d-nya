import React, { useState, useEffect } from 'react'
import { saveOfflineData, syncOfflineData, isOnline, watchConnectionStatus, photoToBase64, getCurrentLocation } from './offlineService'
import { requestNotificationPermission, notifyNewEvent, notifyCleaningReminder, checkNearbyEvents } from './pushNotificationService'

export default function MobileHome({ onNavigate }) {
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [showEventsList, setShowEventsList] = useState(false)
  const [online, setOnline] = useState(isOnline())
  const [cleaningStarted, setCleaningStarted] = useState(false)

  // Bildirim izni iste ve bağlantı durumunu izle
  useEffect(() => {
    requestNotificationPermission()
    watchConnectionStatus(
      () => setOnline(true),
      () => setOnline(false)
    )
  }, [])

  // Logo tıklandığında sayfayı yenile
  const handleLogoClick = () => {
    window.location.reload()
  }

  // Profil butonuna tıklandığında ayarlara git
  const handleProfileClick = () => {
    if (onNavigate) onNavigate('settings')
  }

  return (
    <div className="mobile-app">
      {/* Header - Green Theme */}
      <div className="mobile-header" style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div className="mobile-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <div style={{ color: '#10b981', fontWeight: 800, fontSize: 20 }}>Temiz Dünya</div>
        </div>
        <button className="profile-btn" onClick={handleProfileClick} style={{ background: '#f3f4f6' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>

      <div style={{ padding: '16px 20px', paddingBottom: 100 }}>

        {/* Reward Card - New Design */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: 24,
          padding: 24,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 24,
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
        }}>
          {/* Background decoration */}
          <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1 }}>
            <svg width="180" height="180" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8 8-8z" /></svg>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, opacity: 0.9 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Bu Ayın Büyük Ödülü:</span>
            </div>
            <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
              10.000 TL
            </div>
            <button style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              Detayları Gör
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>

          {/* Cash Icon Graphic */}
          <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.9 }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
          </div>
        </div>

        {/* Quick Actions - Square Buttons */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>HIZLI İŞLEMLER</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {/* Camera */}
            <button onClick={() => setShowPhotoOptions(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', border: 'none', padding: '16px', borderRadius: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
              <div style={{ width: 48, height: 48, background: '#dcfce7', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#10b981' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>Fotoğraf<br />Çek</span>
            </button>
            {/* Report */}
            <button onClick={() => setShowReportForm(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', border: 'none', padding: '16px', borderRadius: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
              <div style={{ width: 48, height: 48, background: '#fee2e2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#ef4444' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>Rapor<br />Et</span>
            </button>
            {/* Events */}
            <button onClick={() => setShowEventsList(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', border: 'none', padding: '16px', borderRadius: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
              <div style={{ width: 48, height: 48, background: '#dbeafe', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#3b82f6' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>Etkinlik<br />Bul</span>
            </button>
          </div>
        </div>

        {/* Map Preview Card */}
        <div onClick={() => onNavigate && onNavigate('map-detail')} style={{
          background: '#fff',
          borderRadius: 24,
          padding: 16,
          marginBottom: 24,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          cursor: 'pointer',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#374151' }}>Yakınındaki Kirli Bölgeler</h3>
            <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>Haritayı Aç ›</span>
          </div>
          <div style={{
            height: 120,
            background: '#e5e7eb',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Simple Map Pattern Placeholder */}
            <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") #e5e7eb' }}></div>
            <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 2 }}>
              <div style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }}></div>
              <span style={{ fontSize: 12, fontWeight: 600 }}>3 Acil Nokta</span>
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>GÜNCEL DUYURULAR</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', cursor: 'pointer' }}>Tümünü Gör</span>
          </div>

          <div style={{ background: '#fff', padding: 16, borderRadius: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, background: '#ecfdf5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#374151', fontSize: 15, marginBottom: 2 }}>Hafta Sonu Temizlik Etkinliği</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Kuğulu Park'ta buluşuyoruz, tüm gönüllüler davetlidir.</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </div>
        </div>

      </div>

      {/* Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <button className="nav-item" onClick={() => onNavigate && onNavigate('settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          <span>Ayarlar</span>
        </button>

        <button className="nav-item" onClick={() => onNavigate && onNavigate('groups')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          <span>Grup Oluştur</span>
        </button>

        {/* Central Home Button */}
        <button className="nav-item nav-center" onClick={() => onNavigate && onNavigate('analysis')}>
          <div className="nav-center-circle" style={{ background: '#10b981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          </div>
        </button>

        <button className="nav-item" onClick={() => onNavigate && onNavigate('emergency')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          <span>Acil Durum</span>
        </button>

        <button className="nav-item" onClick={() => onNavigate && onNavigate('rankings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></svg>
          <span>Sıralama</span>
        </button>
      </div>

      {/* Rapor Form Modal */}
      {showReportForm && (
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
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 800 }}>🚨 Kirli Alan Raporla</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              alert('Raporunuz başarıyla gönderildi!');
              setShowReportForm(false);
            }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 6 }}>Sorun Tanımı</label>
              <input type="text" placeholder="Örn: Plastik ve evsel atıklar" required style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #d1d5db', marginBottom: 16, boxSizing: 'border-box' }} />
              
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 6 }}>Açıklama</label>
              <textarea placeholder="Bölgeyle ilgili ek bilgiler..." rows={3} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #d1d5db', marginBottom: 20, boxSizing: 'border-box' }}></textarea>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowReportForm(false)} style={{ flex: 1, padding: 12, background: '#f3f4f6', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}>İptal</button>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}>Gönder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fotoğraf Çek Modal */}
      {showPhotoOptions && (
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
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 800 }}>📸 Fotoğraf Yükle</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => { alert('Kamera açılıyor...'); setShowPhotoOptions(false); }} style={{ width: '100%', padding: 16, background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                📷 Kamera ile Çek
              </button>
              <button onClick={() => { alert('Galeri açılıyor...'); setShowPhotoOptions(false); }} style={{ width: '100%', padding: 16, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                🖼️ Galeriden Seç
              </button>
              <button onClick={() => setShowPhotoOptions(false)} style={{ width: '100%', padding: 12, background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>Kapat</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
