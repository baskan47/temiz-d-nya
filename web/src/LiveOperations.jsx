import React, { useState, useEffect } from 'react'
import theme from './theme'

/**
 * 📊 Canlı Operasyon İzleme
 */
const LiveOperations = () => {
  const [operations, setOperations] = useState([
    {
      id: 1,
      name: 'Meles Deresi Temizliği - Operasyon #1',
      group: 'Alsancak Temiz Gönüllüler',
      startTime: '14:30',
      duration: '2h 15m',
      volunteers: 5,
      areaSize: 250,
      wasteCollected: 45,
      wasteTarget: 70,
      status: 'active',
      coordinates: '38.4161, 27.1398',
      photos: 12,
      updates: 8,
    },
    {
      id: 2,
      name: 'Mithatpaşa Parkı Bakımı - Operasyon #2',
      group: 'Konak Çevre Koruma',
      startTime: '15:00',
      duration: '1h 45m',
      volunteers: 3,
      areaSize: 180,
      wasteCollected: 25,
      wasteTarget: 40,
      status: 'active',
      coordinates: '38.4220, 27.1500',
      photos: 8,
      updates: 5,
    },
    {
      id: 3,
      name: 'Alsancak Sokakları - Operasyon #3',
      group: 'Alsancak Temiz Gönüllüler',
      startTime: '13:00',
      duration: '3h 30m',
      volunteers: 6,
      areaSize: 320,
      wasteCollected: 62,
      wasteTarget: 65,
      status: 'finishing',
      coordinates: '38.4100, 27.1300',
      photos: 24,
      updates: 15,
    },
  ])

  const [selectedOp, setSelectedOp] = useState(null)
  const [mapMode, setMapMode] = useState(false)

  // Otomatik güncelleme simülasyonu
  useEffect(() => {
    const interval = setInterval(() => {
      setOperations(prev => prev.map(op => ({
        ...op,
        wasteCollected: Math.min(op.wasteCollected + Math.random() * 2, op.wasteTarget),
        updates: op.updates + Math.floor(Math.random()),
      })))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <h2 style={{ margin: 0, color: theme.colors.dark, fontSize: 20, fontWeight: 700 }}>
          📊 Canlı Operasyonlar
        </h2>
        <button
          onClick={() => setMapMode(!mapMode)}
          style={{
            background: mapMode ? theme.colors.primary : theme.colors.light,
            color: mapMode ? 'white' : theme.colors.dark,
            border: 'none',
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderRadius: theme.radius.md,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          {mapMode ? '📋 Liste' : '🗺️ Harita'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: theme.spacing.lg }}>
        {operations.map(op => (
          <OperationCard
            key={op.id}
            operation={op}
            onClick={() => setSelectedOp(op)}
          />
        ))}
      </div>

      {selectedOp && (
        <OperationDetailModal
          operation={selectedOp}
          onClose={() => setSelectedOp(null)}
        />
      )}
    </div>
  )
}

const OperationCard = ({ operation, onClick }) => {
  const progress = (operation.wasteCollected / operation.wasteTarget) * 100

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadows.md,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        borderLeft: `4px solid ${operation.status === 'finishing' ? theme.colors.warning : theme.colors.success}`,
      }}
      onMouseOver={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = theme.shadows.lg
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = theme.shadows.md
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: theme.spacing.md }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h3 style={{ margin: 0, color: theme.colors.dark, fontSize: 16, fontWeight: 700 }}>
              {operation.name}
            </h3>
            <p style={{ margin: '4px 0 0 0', color: theme.colors.textSecondary, fontSize: 12 }}>
              👥 {operation.group}
            </p>
          </div>
          <div style={{
            background: operation.status === 'finishing' ? '#FFA94D20' : '#51CF6620',
            color: operation.status === 'finishing' ? '#FFA94D' : '#51CF66',
            padding: '4px 12px',
            borderRadius: theme.radius.sm,
            fontSize: 11,
            fontWeight: 700,
          }}>
            {operation.status === 'finishing' ? '🏁 Bitiş' : '🟢 Devam'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: theme.spacing.md }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
          <span style={{ color: theme.colors.dark, fontWeight: 600 }}>Atık Toplanması</span>
          <span style={{ color: theme.colors.primary, fontWeight: 700 }}>
            {operation.wasteCollected.toFixed(0)}kg / {operation.wasteTarget}kg
          </span>
        </div>
        <div style={{
          width: '100%',
          height: 10,
          background: theme.colors.light,
          borderRadius: theme.radius.sm,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: theme.gradients.primary,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: theme.spacing.sm,
        padding: `${theme.spacing.md} 0`,
        borderTop: `1px solid ${theme.colors.light}`,
        borderBottom: `1px solid ${theme.colors.light}`,
        marginBottom: theme.spacing.md,
      }}>
        <StatItem emoji="⏱️" label="Süre" value={operation.duration} />
        <StatItem emoji="👥" label="Kişi" value={operation.volunteers} />
        <StatItem emoji="📐" label="Alan" value={`${operation.areaSize}m²`} />
        <StatItem emoji="📸" label="Foto" value={operation.photos} />
        <StatItem emoji="📝" label="Güncell." value={operation.updates} />
      </div>

      {/* Action */}
      <div style={{ display: 'flex', gap: theme.spacing.sm }}>
        <button
          style={{
            flex: 1,
            padding: theme.spacing.md,
            background: theme.colors.primary + '20',
            color: theme.colors.primary,
            border: `1px solid ${theme.colors.primary}40`,
            borderRadius: theme.radius.md,
            fontWeight: 700,
            cursor: 'pointer',
        }}
        >
          👁️ İzle
        </button>
        <button
          style={{
            flex: 1,
            padding: theme.spacing.md,
            background: theme.colors.success + '20',
            color: theme.colors.success,
            border: `1px solid ${theme.colors.success}40`,
            borderRadius: theme.radius.md,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📸 Fotoğraf
        </button>
      </div>
    </div>
  )
}

const StatItem = ({ emoji, label, value }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 14, marginBottom: 2 }}>{emoji}</div>
    <div style={{ fontSize: 9, color: theme.colors.textSecondary }}>
      {label}
    </div>
    <div style={{ fontSize: 11, fontWeight: 700, color: theme.colors.primary, marginTop: 2 }}>
      {value}
    </div>
  </div>
)

const OperationDetailModal = ({ operation, onClose }) => (
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <h2 style={{ margin: 0, color: theme.colors.dark }}>
          📊 Operasyon Detayları
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{
        background: theme.colors.light,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.md,
        marginBottom: theme.spacing.lg,
      }}>
        <h3 style={{ margin: 0, marginBottom: theme.spacing.md, color: theme.colors.dark }}>
          {operation.name}
        </h3>
        <DetailItem emoji="👥" label="Grup" value={operation.group} />
        <DetailItem emoji="⏱️" label="Başlama" value={operation.startTime} />
        <DetailItem emoji="📍" label="Konum" value={operation.coordinates} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
      }}>
        <InfoBox emoji="👥" label="Gönüllüler" value={operation.volunteers} />
        <InfoBox emoji="⏱️" label="Süre" value={operation.duration} />
        <InfoBox emoji="📐" label="Alan" value={`${operation.areaSize}m²`} />
        <InfoBox emoji="🗑️" label="Atık" value={`${operation.wasteCollected.toFixed(0)}kg`} />
      </div>

      <button
        onClick={onClose}
        style={{
          width: '100%',
          padding: theme.spacing.lg,
          background: theme.gradients.primary,
          color: 'white',
          border: 'none',
          borderRadius: theme.radius.md,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        ✅ Kapat
      </button>
    </div>
  </>
)

const DetailItem = ({ emoji, label, value }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    padding: `${theme.spacing.sm} 0`,
    borderBottom: `1px solid rgba(0,0,0,0.05)`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{emoji}</span>
      <span style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{label}</span>
    </div>
    <span style={{ fontWeight: 700, color: theme.colors.dark }}>{value}</span>
  </div>
)

const InfoBox = ({ emoji, label, value }) => (
  <div style={{
    background: 'white',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.light}`,
    textAlign: 'center',
  }}>
    <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
    <div style={{ fontSize: 11, color: theme.colors.textSecondary, marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.primary }}>
      {value}
    </div>
  </div>
)

export default LiveOperations
