import React, { useState, useEffect } from 'react'
import { db } from './firebase-init'
import { 
  getAdminConfig, 
  updateAdminConfig, 
  getConfigHistory,
  resetConfigToDefaults 
} from './firestoreService'
import { theme } from './theme'

const DEFAULT_CONFIG = {
  scoreFactors: {
    WEIGHT: 0.30,
    DIFFICULTY: 0.20,
    URGENCY: 0.15,
    EFFICIENCY: 0.20,
    VERIFICATION: 0.10,
    TIME: 0.05,
  },
  bonusMultipliers: {
    leaderboardTop10: 1.20,
    leaderboardTop50: 1.10,
    leaderboardTop100: 1.05,
    streakMultiplier: 1.02,
    teamEfficiencyBonus: {
      solo: 1.0,
      small: 1.10,
      medium: 1.20,
      large: 1.30,
    },
  },
  achievements: {
    firstCleanup: 10,
    tenCleanups: 50,
    fiftyCleanups: 100,
    hundredCleanups: 200,
    teamLeader: 150,
    photoVerified: 25,
    efficiencyMaster: 75,
    consistencyWeek: 30,
    consistencyMonth: 60,
    highDifficulty: 50,
  },
  badgeThresholds: {
    bronze: 0,
    silver: 500,
    gold: 1000,
    platinum: 2000,
  },
  levelThresholds: {
    novice: 0,
    beginner: 100,
    intermediate: 500,
    pro: 1000,
    expert: 2000,
    master: 5000,
  },
}

export function AdminScoringPanel() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('factors')

  // Load config on mount
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const currentConfig = await getAdminConfig(db)
      const configHistory = await getConfigHistory(db)
      
      setConfig(currentConfig || DEFAULT_CONFIG)
      setHistory(configHistory || [])
    } catch (err) {
      setMessage(`Hata: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateAdminConfig(db, config)
      setMessage('✅ Konfigürasyon kaydedildi')
      setTimeout(() => setMessage(''), 3000)
      loadConfig()
    } catch (err) {
      setMessage(`❌ Hata: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!window.confirm('Tüm ayarları varsayılana sıfırlamak istediğinizden emin misiniz?')) {
      return
    }
    try {
      setSaving(true)
      await resetConfigToDefaults(db)
      setConfig(DEFAULT_CONFIG)
      setMessage('✅ Varsayılan ayarlar geri yüklendi')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage(`❌ Hata: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const updateFactor = (key, value) => {
    setConfig(prev => ({
      ...prev,
      scoreFactors: {
        ...prev.scoreFactors,
        [key]: parseFloat(value) || 0,
      },
    }))
  }

  const updateBonus = (path, value) => {
    const [key, subkey] = path.split('.')
    setConfig(prev => {
      if (subkey) {
        return {
          ...prev,
          bonusMultipliers: {
            ...prev.bonusMultipliers,
            [key]: {
              ...prev.bonusMultipliers[key],
              [subkey]: parseFloat(value) || 0,
            },
          },
        }
      } else {
        return {
          ...prev,
          bonusMultipliers: {
            ...prev.bonusMultipliers,
            [key]: parseFloat(value) || 0,
          },
        }
      }
    })
  }

  const updateAchievement = (key, value) => {
    setConfig(prev => ({
      ...prev,
      achievements: {
        ...prev.achievements,
        [key]: parseInt(value) || 0,
      },
    }))
  }

  const updateThreshold = (type, badge, value) => {
    setConfig(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [badge]: parseInt(value) || 0,
      },
    }))
  }

  if (loading) {
    return (
      <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
        Yükleniyor...
      </div>
    )
  }

  const Card = ({ children }) => (
    <div
      style={{
        background: 'white',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        boxShadow: theme.shadows.sm,
        border: `1px solid ${theme.colors.light}`,
      }}
    >
      {children}
    </div>
  )

  const FactorInput = ({ label, value, onChange, help }) => (
    <div style={{ marginBottom: theme.spacing.md }}>
      <label style={{ display: 'block', marginBottom: theme.spacing.xs, fontWeight: 600 }}>
        {label}
      </label>
      <input
        type="number"
        step="0.01"
        min="0"
        max="1"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          padding: theme.spacing.sm,
          border: `1px solid ${theme.colors.light}`,
          borderRadius: theme.radius.sm,
          fontSize: 14,
        }}
      />
      {help && <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>{help}</div>}
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: theme.spacing.xl }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.xl,
        }}
      >
        <h1 style={{ ...theme.typography.sizes.xl, fontWeight: 700 }}>⚙️ Scoring Ayarları</h1>
        <div style={{ display: 'flex', gap: theme.spacing.md }}>
          <button
            onClick={handleReset}
            disabled={saving}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: theme.colors.warning,
              color: 'white',
              border: 'none',
              borderRadius: theme.radius.sm,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            🔄 Sıfırla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: saving ? theme.colors.textSecondary : theme.colors.success,
              color: 'white',
              border: 'none',
              borderRadius: theme.radius.sm,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Kaydediliyor...' : '💾 Kaydet'}
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: theme.spacing.md,
            background: message.includes('✅') ? '#e8f5e9' : '#ffebee',
            color: message.includes('✅') ? '#2e7d32' : '#c62828',
            borderRadius: theme.radius.sm,
            marginBottom: theme.spacing.lg,
          }}
        >
          {message}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: theme.spacing.md, marginBottom: theme.spacing.lg, borderBottom: `2px solid ${theme.colors.light}` }}>
        {['factors', 'bonuses', 'achievements', 'thresholds', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: activeTab === tab ? theme.colors.primary : 'transparent',
              color: activeTab === tab ? 'white' : theme.colors.text,
              border: 'none',
              borderRadius: `${theme.radius.sm} ${theme.radius.sm} 0 0`,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {tab === 'factors' && '📊 Faktörler'}
            {tab === 'bonuses' && '🎁 Bonuslar'}
            {tab === 'achievements' && '🏆 Başarılar'}
            {tab === 'thresholds' && '📈 Eşikler'}
            {tab === 'history' && '📜 Geçmiş'}
          </button>
        ))}
      </div>

      {/* Score Factors */}
      {activeTab === 'factors' && (
        <Card>
          <h2 style={{ ...theme.typography.sizes.lg, fontWeight: 700, marginBottom: theme.spacing.lg }}>
            Puan Faktörleri (Ağırlıkları)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.lg }}>
            <FactorInput
              label="🏋️ Ağırlık (WEIGHT)"
              value={config.scoreFactors.WEIGHT}
              onChange={v => updateFactor('WEIGHT', v)}
              help="Temizlik alanının ağırlığı (0-1)"
            />
            <FactorInput
              label="💪 Zorluk (DIFFICULTY)"
              value={config.scoreFactors.DIFFICULTY}
              onChange={v => updateFactor('DIFFICULTY', v)}
              help="Temizlik zorluk derecesi (0-1)"
            />
            <FactorInput
              label="⏰ Aciliyet (URGENCY)"
              value={config.scoreFactors.URGENCY}
              onChange={v => updateFactor('URGENCY', v)}
              help="İş yoğunluğu/aciliyet (0-1)"
            />
            <FactorInput
              label="👥 Verimlilik (EFFICIENCY)"
              value={config.scoreFactors.EFFICIENCY}
              onChange={v => updateFactor('EFFICIENCY', v)}
              help="Takım verimliliği (0-1)"
            />
            <FactorInput
              label="✅ Doğrulama (VERIFICATION)"
              value={config.scoreFactors.VERIFICATION}
              onChange={v => updateFactor('VERIFICATION', v)}
              help="Fotoğraf doğrulaması bonusu (0-1)"
            />
            <FactorInput
              label="⏱️ Zaman (TIME)"
              value={config.scoreFactors.TIME}
              onChange={v => updateFactor('TIME', v)}
              help="Harcanan zaman faktörü (0-1)"
            />
          </div>
          <div style={{ marginTop: theme.spacing.lg, padding: theme.spacing.md, background: '#f5f5f5', borderRadius: theme.radius.sm }}>
            <strong>Toplam: {(Object.values(config.scoreFactors).reduce((a, b) => a + b, 0)).toFixed(2)}</strong>
            {Math.abs(Object.values(config.scoreFactors).reduce((a, b) => a + b, 0) - 1.0) > 0.01 && (
              <div style={{ color: theme.colors.warning, fontSize: 12 }}>
                ⚠️ Toplam 1.0 olmalı (Şu an: {(Object.values(config.scoreFactors).reduce((a, b) => a + b, 0)).toFixed(2)})
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Bonuses */}
      {activeTab === 'bonuses' && (
        <Card>
          <h2 style={{ ...theme.typography.sizes.lg, fontWeight: 700, marginBottom: theme.spacing.lg }}>
            Bonus Çarpanları
          </h2>
          
          <h3 style={{ fontWeight: 600, marginBottom: theme.spacing.md, color: theme.colors.textSecondary }}>
            🏆 Liderlik Tahtası Bonusları
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
            <FactorInput
              label="Top 10 Çarpanı"
              value={config.bonusMultipliers.leaderboardTop10}
              onChange={v => updateBonus('leaderboardTop10', v)}
              help="Top 10'da yer alanlar için çarpan"
            />
            <FactorInput
              label="Top 50 Çarpanı"
              value={config.bonusMultipliers.leaderboardTop50}
              onChange={v => updateBonus('leaderboardTop50', v)}
              help="Top 50'de yer alanlar için çarpan"
            />
            <FactorInput
              label="Top 100 Çarpanı"
              value={config.bonusMultipliers.leaderboardTop100}
              onChange={v => updateBonus('leaderboardTop100', v)}
              help="Top 100'de yer alanlar için çarpan"
            />
            <FactorInput
              label="Çizgi Bonusu Çarpanı"
              value={config.bonusMultipliers.streakMultiplier}
              onChange={v => updateBonus('streakMultiplier', v)}
              help="Her gün temizlik yapan kişiler için çarpan"
            />
          </div>

          <h3 style={{ fontWeight: 600, marginBottom: theme.spacing.md, color: theme.colors.textSecondary }}>
            👥 Takım Verimliliği Bonusları
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.lg }}>
            <FactorInput
              label="Solo (1 kişi)"
              value={config.bonusMultipliers.teamEfficiencyBonus.solo}
              onChange={v => updateBonus('teamEfficiencyBonus.solo', v)}
              help="Tek başına temizlik yapanlar"
            />
            <FactorInput
              label="Küçük Takım (2-3 kişi)"
              value={config.bonusMultipliers.teamEfficiencyBonus.small}
              onChange={v => updateBonus('teamEfficiencyBonus.small', v)}
              help="2-3 kişilik takımlar"
            />
            <FactorInput
              label="Orta Takım (4-5 kişi)"
              value={config.bonusMultipliers.teamEfficiencyBonus.medium}
              onChange={v => updateBonus('teamEfficiencyBonus.medium', v)}
              help="4-5 kişilik takımlar"
            />
            <FactorInput
              label="Büyük Takım (6+ kişi)"
              value={config.bonusMultipliers.teamEfficiencyBonus.large}
              onChange={v => updateBonus('teamEfficiencyBonus.large', v)}
              help="6 ve üzeri kişilik takımlar"
            />
          </div>
        </Card>
      )}

      {/* Achievements */}
      {activeTab === 'achievements' && (
        <Card>
          <h2 style={{ ...theme.typography.sizes.lg, fontWeight: 700, marginBottom: theme.spacing.lg }}>
            Başarı Puanları
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.lg }}>
            {Object.entries(config.achievements).map(([key, value]) => (
              <div key={key}>
                <label style={{ display: 'block', marginBottom: theme.spacing.xs, fontWeight: 600 }}>
                  {key.replace(/_/g, ' ').toUpperCase()}
                </label>
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={e => updateAchievement(key, e.target.value)}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    border: `1px solid ${theme.colors.light}`,
                    borderRadius: theme.radius.sm,
                    fontSize: 14,
                  }}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Thresholds */}
      {activeTab === 'thresholds' && (
        <Card>
          <h2 style={{ ...theme.typography.sizes.lg, fontWeight: 700, marginBottom: theme.spacing.xl }}>
            İlerleme Eşikleri
          </h2>

          <h3 style={{ fontWeight: 600, marginBottom: theme.spacing.md, color: theme.colors.textSecondary }}>
            🏅 Badge Eşikleri
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
            {Object.entries(config.badgeThresholds).map(([badge, score]) => (
              <div key={badge}>
                <label style={{ display: 'block', marginBottom: theme.spacing.xs, fontWeight: 600 }}>
                  {badge.toUpperCase()} Badge
                </label>
                <input
                  type="number"
                  min="0"
                  value={score}
                  onChange={e => updateThreshold('badgeThresholds', badge, e.target.value)}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    border: `1px solid ${theme.colors.light}`,
                    borderRadius: theme.radius.sm,
                    fontSize: 14,
                  }}
                />
              </div>
            ))}
          </div>

          <h3 style={{ fontWeight: 600, marginBottom: theme.spacing.md, color: theme.colors.textSecondary }}>
            ⭐ Level Eşikleri
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.lg }}>
            {Object.entries(config.levelThresholds).map(([level, score]) => (
              <div key={level}>
                <label style={{ display: 'block', marginBottom: theme.spacing.xs, fontWeight: 600 }}>
                  {level.toUpperCase()} Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={score}
                  onChange={e => updateThreshold('levelThresholds', level, e.target.value)}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    border: `1px solid ${theme.colors.light}`,
                    borderRadius: theme.radius.sm,
                    fontSize: 14,
                  }}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <Card>
          <h2 style={{ ...theme.typography.sizes.lg, fontWeight: 700, marginBottom: theme.spacing.lg }}>
            Konfigürasyon Geçmişi
          </h2>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', color: theme.colors.textSecondary, padding: theme.spacing.lg }}>
              Henüz değişiklik geçmişi yok
            </div>
          ) : (
            <div>
              {history.map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: theme.spacing.md,
                    borderBottom: idx < history.length - 1 ? `1px solid ${theme.colors.light}` : 'none',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: theme.spacing.xs }}>
                    {entry.changedBy}
                  </div>
                  <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
                    {new Date(entry.timestamp).toLocaleString('tr-TR')}
                  </div>
                  <div style={{ fontSize: 13, background: '#f5f5f5', padding: theme.spacing.sm, borderRadius: theme.radius.sm }}>
                    <strong>Değişiklikler:</strong>
                    <pre style={{ fontSize: 12, overflow: 'auto', marginTop: 4 }}>
                      {entry.changes || 'Değişiklik detayı mevcut değil'}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
