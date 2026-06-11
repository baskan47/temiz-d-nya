import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import theme from './theme'

/**
 * 🗺️ Profesyonel Harita Sistemi
 * Temiz Dünya - Mobil Harita Görünümü
 */
const ProfessionalMap = () => {
  const mapRef = useRef(null)
  const [userLocation, setUserLocation] = useState({ lat: 38.4161, lng: 27.1398 }) // İzmir
  const [cleanedAreas, setCleanedAreas] = useState([
    { id: 1, lat: 38.4161, lng: 27.1398, name: 'Alsancak', radius: 500, date: '2 saat önce', cleanedBy: '12 kişi' },
    { id: 2, lat: 38.4220, lng: 27.1500, name: 'Konak', radius: 350, date: '4 saat önce', cleanedBy: '8 kişi' },
    { id: 3, lat: 38.4100, lng: 27.1300, name: 'Balçova', radius: 420, date: '6 saat önce', cleanedBy: '15 kişi' },
  ])
  const [dirtyAreas, setDirtyAreas] = useState([
    { id: 1, lat: 38.4250, lng: 27.1450, name: 'Karsıyaka', severity: 'high', reports: 3 },
    { id: 2, lat: 38.4080, lng: 27.1350, name: 'Gaziemir', severity: 'medium', reports: 1 },
  ])
  const [activeTasks, setActiveTasks] = useState([
    { id: 1, lat: 38.4180, lng: 27.1420, name: 'Meles Deresi', volunteers: 5, progress: 45 },
    { id: 2, lat: 38.4140, lng: 27.1480, name: 'Mithatpaşa Parkı', volunteers: 8, progress: 75 },
  ])
  const [groups, setGroups] = useState([
    { id: 1, lat: 38.4160, lng: 27.1390, name: 'Gönüllü Grubu #1', members: 12, active: true },
  ])
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportLocation, setReportLocation] = useState(null)
  const [selectedArea, setSelectedArea] = useState(null)
  const mapInstance = useRef(null)

  // Haritayı başlat
  useEffect(() => {
    if (!mapRef.current) return

    // Leaflet harita oluştur
    mapInstance.current = L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 14)

    // OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      tileSize: 256,
    }).addTo(mapInstance.current)

    // Kullanıcı konumu işaretle
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: `
        <div style="
          width: 30px;
          height: 30px;
          background: ${theme.colors.primary};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 3px ${theme.colors.primary}40;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
        ">📍</div>
      `,
      iconSize: [30, 30],
    })
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(mapInstance.current)
      .bindPopup('👤 Konumunuz')

    // Temizlenmiş bölgeler (Yeşil)
    cleanedAreas.forEach(area => {
      L.circle([area.lat, area.lng], {
        color: theme.colors.success,
        fillColor: theme.colors.success,
        fillOpacity: 0.2,
        weight: 2,
        radius: area.radius,
      }).addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family: Poppins">
            <strong>✅ ${area.name}</strong><br/>
            Temizlenmiş: ${area.date}<br/>
            Gönüllüler: ${area.cleanedBy}
          </div>
        `)
        .on('click', () => setSelectedArea(area))
    })

    // Kirli bölgeler (Kırmızı)
    dirtyAreas.forEach(area => {
      const iconColor = area.severity === 'high' ? '#FF6B6B' : '#FFA94D'
      const icon = L.divIcon({
        className: 'dirty-marker',
        html: `<div style="
          width: 24px;
          height: 24px;
          background: ${iconColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          animation: pulse 2s infinite;
        ">⚠️</div>`,
        iconSize: [24, 24],
      })
      L.marker([area.lat, area.lng], { icon }).addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family: Poppins">
            <strong>🔴 ${area.name}</strong><br/>
            Şiddet: ${area.severity === 'high' ? '🔴 Yüksek' : '🟠 Orta'}<br/>
            Raporlar: ${area.reports}
          </div>
        `)
        .on('click', () => setSelectedArea(area))
    })

    // Aktif görevler (Sarı)
    activeTasks.forEach(task => {
      const icon = L.divIcon({
        className: 'task-marker',
        html: `<div style="
          width: 28px;
          height: 28px;
          background: ${theme.colors.tertiary};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">🎯</div>`,
        iconSize: [28, 28],
      })
      L.marker([task.lat, task.lng], { icon }).addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family: Poppins">
            <strong>🎯 ${task.name}</strong><br/>
            Gönüllüler: ${task.volunteers}<br/>
            İlerleme: ${task.progress}%
          </div>
        `)
        .on('click', () => setSelectedArea(task))
    })

    // Gruplar (Mor)
    groups.forEach(group => {
      const icon = L.divIcon({
        className: 'group-marker',
        html: `<div style="
          width: 26px;
          height: 26px;
          background: #B197FC;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
        ">👥</div>`,
        iconSize: [26, 26],
      })
      L.marker([group.lat, group.lng], { icon }).addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family: Poppins">
            <strong>👥 ${group.name}</strong><br/>
            Üyeler: ${group.members}<br/>
            Durum: ${group.active ? '🟢 Aktif' : '🔴 Pasif'}
          </div>
        `)
    })

    // Harita tıklama - hata bildir
    mapInstance.current.on('click', (e) => {
      setReportLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
      setShowReportModal(true)
    })

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [userLocation, cleanedAreas, dirtyAreas, activeTasks, groups])

  // Hata bildirme formu gönder
  const handleReportSubmit = (e) => {
    e.preventDefault()
    if (reportLocation) {
      alert(`✅ Hata bildirimi gönderildi!\nKonum: ${reportLocation.lat.toFixed(4)}, ${reportLocation.lng.toFixed(4)}`)
      setShowReportModal(false)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Harita */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 0,
        }}
      />

      {/* Hata Bildir Modal */}
      {showReportModal && (
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
            onClick={() => setShowReportModal(false)}
          />
          <div style={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            right: 20,
            background: 'white',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            boxShadow: theme.shadows.xl,
            zIndex: 1000,
            maxWidth: 400,
            margin: '0 auto',
          }}>
            <h3 style={{ margin: '0 0 ' + theme.spacing.md + ' 0', color: theme.colors.dark }}>
              📸 Temizlik Sorunu Bildir
            </h3>
            <form onSubmit={handleReportSubmit}>
              <input
                type="text"
                placeholder="Sorunun tanımı"
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.light}`,
                  marginBottom: theme.spacing.md,
                  fontFamily: theme.typography.fonts.main,
                  boxSizing: 'border-box',
                }}
              />
              <textarea
                placeholder="Detaylar..."
                rows={3}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.light}`,
                  marginBottom: theme.spacing.md,
                  fontFamily: theme.typography.fonts.main,
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: theme.spacing.md }}>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
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
                  type="submit"
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
                  📸 Fotoğraf Ekle
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Başlık */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        background: 'white',
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadows.md,
        zIndex: 100,
      }}>
        <h2 style={{ margin: 0, color: theme.colors.primary, fontSize: 18, fontWeight: 700 }}>
          🗺️ Canlı Temizlik Haritası
        </h2>
      </div>

      {/* Statlar */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 10,
        right: 10,
        background: 'white',
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadows.md,
        zIndex: 100,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: theme.spacing.sm,
      }}>
        <StatBubble emoji="✅" label="Temiz" value={cleanedAreas.length} />
        <StatBubble emoji="🔴" label="Kirli" value={dirtyAreas.length} />
        <StatBubble emoji="🎯" label="Görev" value={activeTasks.length} />
        <StatBubble emoji="👥" label="Grup" value={groups.length} />
      </div>

      <style>{`
        .leaflet-container { font-family: 'Poppins', sans-serif; }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(255, 107, 107, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }
        }
      `}</style>
    </div>
  )
}

const StatBubble = ({ emoji, label, value }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  }}>
    <div style={{ fontSize: 18 }}>{emoji}</div>
    <div style={{ fontSize: 10, color: theme.colors.textSecondary, fontWeight: 500 }}>
      {label}
    </div>
    <div style={{ fontSize: 14, color: theme.colors.primary, fontWeight: 700 }}>
      {value}
    </div>
  </div>
)

export default ProfessionalMap
