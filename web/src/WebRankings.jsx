import React, { useState, useEffect } from 'react'
import theme from './theme'
import { Card } from './components'
import { watchLeaderboard } from './firestoreService'

const getBadgeEmoji = (badge) => {
  switch (badge) {
    case 'silver': return '🥈'
    case 'gold': return '🥇'
    case 'platinum': return '💎'
    case 'bronze':
    default: return '🥉'
  }
}

const getLevelEmoji = (level) => {
  switch (level) {
    case 'beginner': return '🌱'
    case 'intermediate': return '🔥'
    case 'pro': return '⚡'
    case 'expert': return '🌟'
    case 'master': return '👑'
    case 'novice':
    default: return '🎯'
  }
}

/**
 * WebRankings Component
 * Web version of mobile rankings with modern design
 * Features: Segmented time filter, medal system, color-coded ranks, badges
 */
const WebRankings = ({ onBack }) => {
  const [timeFilter, setTimeFilter] = useState('all-time')
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!window.firestore) return
    
    const unsub = watchLeaderboard(window.firestore, (data) => {
      setRankings(data)
      setLoading(false)
    })

    return unsub
  }, [])

  const getMedalColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700'
      case 2: return '#C0C0C0'
      case 3: return '#CD7F32'
      default: return theme.colors.primary
    }
  }

  const getMedalEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `${rank}️⃣`
    }
  }

  return (
    <div>
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.colors.primary,
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 600,
            marginBottom: theme.spacing.lg,
            padding: 0,
          }}
        >
          ← Geri Dön
        </button>
      )}

      {/* Header with Filter */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h2 style={{ ...theme.typography.sizes.xl, fontWeight: 700, marginBottom: theme.spacing.lg, color: theme.colors.dark }}>
          🏆 Puan Sıralaması
        </h2>

        {/* Time Filter Buttons */}
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
          {[
            { key: 'week', label: 'Bu Hafta' },
            { key: 'month', label: 'Bu Ay' },
            { key: 'all-time', label: 'Tüm Zamanlar' },
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setTimeFilter(filter.key)}
              style={{
                background: timeFilter === filter.key ? theme.colors.primary : 'white',
                color: timeFilter === filter.key ? 'white' : theme.colors.dark,
                border: `2px solid ${timeFilter === filter.key ? theme.colors.primary : theme.colors.light}`,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                transition: 'all 0.3s ease',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Showcase */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: theme.spacing.lg,
          marginBottom: theme.spacing.xl,
        }}
      >
        {rankings.slice(0, 3).map((user, idx) => {
          const medalColor = getMedalColor(user.rank)
          return (
            <Card
              key={user.userId}
              style={{
                background: `linear-gradient(135deg, ${medalColor}15 0%, ${medalColor}05 100%)`,
                border: `2px solid ${medalColor}30`,
                textAlign: 'center',
                boxShadow: idx === 0 ? theme.shadows.lg : theme.shadows.md,
                transform: idx === 0 ? 'translateY(-8px)' : 'translateY(0)',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: theme.spacing.sm }}>{getMedalEmoji(user.rank)}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.dark, marginBottom: theme.spacing.xs }}>
                {user.userName}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: medalColor }}>{user.totalScore}</div>
              <div style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: theme.spacing.xs }}>Puan</div>
              <div style={{ fontSize: 16, marginTop: theme.spacing.sm }}>
                {getBadgeEmoji(user.badge)} {getLevelEmoji(user.level)}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Full Rankings List */}
      <Card>
        <h3 style={{ ...theme.typography.sizes.lg, fontWeight: 700, marginBottom: theme.spacing.lg, color: theme.colors.dark }}>
          Tüm Sıralama
        </h3>
        {loading && (
          <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.textSecondary }}>
            Yükleniyor...
          </div>
        )}
        <div>
          {rankings.map((user, idx) => {
            const medalColor = getMedalColor(user.rank)
            return (
              <div
                key={user.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: `${theme.spacing.md} 0`,
                  borderBottom: idx < rankings.length - 1 ? `1px solid ${theme.colors.light}` : 'none',
                  animation: `slideIn 0.4s ease-out`,
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flex: 1 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: theme.radius.md,
                      background: medalColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 700,
                      minWidth: 40,
                      color: 'white',
                    }}
                  >
                    {user.rank <= 3 ? getMedalEmoji(user.rank) : user.rank}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: theme.colors.dark }}>{user.userName}</div>
                    <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                      {user.cleanupCount} görev • {getBadgeEmoji(user.badge)} {getLevelEmoji(user.level)}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    background: theme.gradients.primary,
                    color: 'white',
                    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                    borderRadius: theme.radius.md,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {user.totalScore}
                </div>
              </div>
            )
          })}
          {rankings.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.textSecondary }}>
              Henüz sıralama verisi yok
            </div>
          )}
        </div>
      </Card>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

export default WebRankings
