import React, { useState } from 'react'
import theme from './theme'
import { Card, ProgressBar, Badge, StatCard, Grid } from './components'

/**
 * WebScores Component
 * Web version of mobile scores screen with modern design
 * Features: Progress tracking, badge tiers, leaderboard preview
 */
const WebScores = ({ onBack }) => {
  const [userPoints] = useState(3250)
  const maxPoints = 5000
  const progress = (userPoints / maxPoints) * 100
  
  // Badge tier system (same as mobile)
  const badges = [
    { emoji: '🌱', name: 'Sprout', minPoints: 0, maxPoints: 500 },
    { emoji: '🌿', name: 'Seedling', minPoints: 500, maxPoints: 1000 },
    { emoji: '🌳', name: 'Sapling', minPoints: 1000, maxPoints: 1500 },
    { emoji: '🌲', name: 'Tree', minPoints: 1500, maxPoints: 2000 },
    { emoji: '🌴', name: 'Palm', minPoints: 2000, maxPoints: 2500 },
    { emoji: '🌵', name: 'Desert Tree', minPoints: 2500, maxPoints: 3000 },
    { emoji: '🎋', name: 'Bamboo', minPoints: 3000, maxPoints: 3500 },
    { emoji: '🎑', name: 'Forest', minPoints: 3500, maxPoints: 5000 },
  ]

  const getCurrentBadge = () => {
    return badges.find(b => userPoints >= b.minPoints && userPoints < b.maxPoints) || badges[0]
  }

  const getNextBadge = () => {
    return badges.find(b => userPoints < b.maxPoints && userPoints >= b.minPoints) || badges[badges.length - 1]
  }

  const currentBadge = getCurrentBadge()
  const nextBadge = getNextBadge()

  // Sample leaderboard data
  const leaderboard = [
    { rank: 1, name: 'Ali Kaya', points: 4850, badge: '🎑' },
    { rank: 2, name: 'Zeynep Yıldız', points: 4200, badge: '🎑' },
    { rank: 3, name: 'Mehmet Çapar', points: 3800, badge: '🌴' },
    { rank: 4, name: 'Ayşe Demir', points: 3250, badge: '🌳' },
    { rank: 5, name: 'Fatih Esen', points: 2900, badge: '🌿' },
  ]

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

      {/* Gradient Header */}
      <div
        style={{
          background: theme.gradients.primary,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.xl,
          color: 'white',
          marginBottom: theme.spacing.xl,
          boxShadow: theme.shadows.lg,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>Toplam Puanlarım</div>
            <div style={{ fontSize: 36, fontWeight: 700, marginTop: theme.spacing.xs }}>{userPoints}</div>
          </div>
          <div style={{ fontSize: 48 }}>{currentBadge.emoji}</div>
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{ marginBottom: theme.spacing.sm, fontSize: 13 }}>
            {nextBadge.name}'e kadar: {nextBadge.minPoints - userPoints} puan
          </div>
          <ProgressBar
            current={userPoints}
            total={maxPoints}
            color="white"
            backgroundColor="rgba(255,255,255,0.2)"
          />
        </div>
      </div>

      {/* Achievement Badges Grid */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h3 style={{ ...theme.typography.sizes.lg, fontWeight: 700, marginBottom: theme.spacing.lg, color: theme.colors.dark }}>
          🏆 Başarı Rozeti Sistemi
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: theme.spacing.md,
          }}
        >
          {badges.map((badge, idx) => {
            const isActive = userPoints >= badge.minPoints
            const isCurrent = userPoints >= badge.minPoints && userPoints < badge.maxPoints
            return (
              <div
                key={idx}
                style={{
                  background: 'white',
                  border: `2px solid ${isCurrent ? theme.colors.primary : isActive ? theme.colors.success : theme.colors.light}`,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                  textAlign: 'center',
                  opacity: isActive ? 1 : 0.5,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  boxShadow: isCurrent ? theme.shadows.lg : theme.shadows.sm,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: theme.spacing.sm }}>{badge.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.colors.dark }}>{badge.name}</div>
                <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>
                  {badge.minPoints}-{badge.maxPoints}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Leaderboard Preview */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <h3 style={{ ...theme.typography.sizes.lg, fontWeight: 700, marginBottom: theme.spacing.lg, color: theme.colors.dark }}>
          📊 Puan Sıralaması
        </h3>
        <div>
          {leaderboard.map((entry, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: `${theme.spacing.md} 0`,
                borderBottom: idx < leaderboard.length - 1 ? `1px solid ${theme.colors.light}` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : theme.colors.light,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: idx < 3 ? 'white' : theme.colors.textSecondary,
                    fontSize: 14,
                  }}
                >
                  {entry.rank}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: theme.colors.dark }}>{entry.name}</div>
                  <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>{entry.badge}</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: theme.colors.primary, fontSize: 16 }}>{entry.points}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Stats Grid */}
      <Grid columns={2} gap={theme.spacing.lg}>
        <StatCard
          icon="🎯"
          label="Temizlik Görevleri"
          value="24"
          color="primary"
          gradient={false}
        />
        <StatCard
          icon="👥"
          label="Grup Üyesi"
          value="8"
          color="secondary"
          gradient={false}
        />
        <StatCard
          icon="📈"
          label="Bu Ay"
          value="+450"
          color="success"
          gradient={false}
        />
        <StatCard
          icon="🏅"
          label="Başarılar"
          value="12"
          color="primary"
          gradient={true}
        />
      </Grid>
    </div>
  )
}

export default WebScores
