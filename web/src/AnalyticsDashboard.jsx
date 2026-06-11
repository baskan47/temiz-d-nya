import React, { useState, useEffect } from 'react'
import { db } from './firebase-init'
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore'
import { theme } from './theme'

export function AnalyticsDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCleanups: 0,
    averageScore: 0,
    totalPoints: 0,
    topScorer: null,
    scoreDistribution: {},
    factorBreakdown: {},
    difficultyStats: {},
    urgencyStats: {},
    teamEfficiency: {},
    badgeDistribution: {},
    levelDistribution: {},
    weeklyTrend: [],
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [chartType, setChartType] = useState('distribution')

  useEffect(() => {
    loadAnalytics()
  }, [selectedPeriod])

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      // Cleanup sessions çek
      const cleanupSnap = await getDocs(
        query(
          collection(db, 'cleanup_sessions'),
          orderBy('createdAt', 'desc'),
          limit(10000)
        )
      )

      // User scores çek
      const userScoresSnap = await getDocs(
        query(
          collection(db, 'user_scores'),
          orderBy('totalScore', 'desc'),
          limit(1000)
        )
      )

      const cleanups = cleanupSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const userScores = userScoresSnap.docs.map(d => ({ id: d.id, ...d.data() }))

      // Filter by period
      const now = new Date()
      let filteredCleanups = cleanups
      if (selectedPeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filteredCleanups = cleanups.filter(c => {
          const date = c.createdAt?.toDate?.() || new Date(c.createdAt)
          return date >= weekAgo
        })
      } else if (selectedPeriod === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        filteredCleanups = cleanups.filter(c => {
          const date = c.createdAt?.toDate?.() || new Date(c.createdAt)
          return date >= monthAgo
        })
      }

      // Calculate analytics
      const totalUsers = userScores.length
      const totalCleanups = filteredCleanups.length
      const averageScore =
        filteredCleanups.length > 0
          ? Math.round(
              filteredCleanups.reduce((sum, c) => sum + (c.earnedPoints || 0), 0) / filteredCleanups.length
            )
          : 0
      const totalPoints = filteredCleanups.reduce((sum, c) => sum + (c.earnedPoints || 0), 0)
      const topScorer = userScores[0]

      // Score distribution (0-20, 20-40, 40-60, 60-80, 80-100)
      const scoreDistribution = {
        '0-20': 0,
        '20-40': 0,
        '40-60': 0,
        '60-80': 0,
        '80-100': 0,
        '100+': 0,
      }
      filteredCleanups.forEach(c => {
        const score = c.earnedPoints || 0
        if (score < 20) scoreDistribution['0-20']++
        else if (score < 40) scoreDistribution['20-40']++
        else if (score < 60) scoreDistribution['40-60']++
        else if (score < 80) scoreDistribution['60-80']++
        else if (score < 100) scoreDistribution['80-100']++
        else scoreDistribution['100+']++
      })

      // Factor breakdown (average contribution)
      const factorBreakdown = {
        weight: 0,
        difficulty: 0,
        urgency: 0,
        efficiency: 0,
        verification: 0,
        time: 0,
      }
      const breakdownCounts = { ...factorBreakdown }
      filteredCleanups.forEach(c => {
        const breakdown = c.scoreBreakdown || {}
        factorBreakdown.weight += breakdown.weight || 0
        factorBreakdown.difficulty += breakdown.difficulty || 0
        factorBreakdown.urgency += breakdown.urgency || 0
        factorBreakdown.efficiency += breakdown.efficiency || 0
        factorBreakdown.verification += breakdown.verification || 0
        factorBreakdown.time += breakdown.time || 0
        Object.keys(breakdownCounts).forEach(k => breakdownCounts[k]++)
      })

      Object.keys(factorBreakdown).forEach(k => {
        factorBreakdown[k] = breakdownCounts[k] > 0 ? Math.round(factorBreakdown[k] / breakdownCounts[k]) : 0
      })

      // Difficulty stats
      const difficultyStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      filteredCleanups.forEach(c => {
        const diff = c.difficulty || 0
        if (diff in difficultyStats) difficultyStats[diff]++
      })

      // Urgency stats
      const urgencyStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      filteredCleanups.forEach(c => {
        const urg = c.urgency || 0
        if (urg in urgencyStats) urgencyStats[urg]++
      })

      // Team efficiency
      const teamEfficiency = {
        solo: 0,
        small: 0,
        medium: 0,
        large: 0,
      }
      filteredCleanups.forEach(c => {
        const members = c.membersCount || 1
        if (members === 1) teamEfficiency.solo++
        else if (members <= 3) teamEfficiency.small++
        else if (members <= 5) teamEfficiency.medium++
        else teamEfficiency.large++
      })

      // Badge distribution
      const badgeDistribution = {
        bronze: userScores.filter(u => u.badge === 'bronze').length,
        silver: userScores.filter(u => u.badge === 'silver').length,
        gold: userScores.filter(u => u.badge === 'gold').length,
        platinum: userScores.filter(u => u.badge === 'platinum').length,
      }

      // Level distribution
      const levelDistribution = {
        novice: userScores.filter(u => u.level === 'novice').length,
        beginner: userScores.filter(u => u.level === 'beginner').length,
        intermediate: userScores.filter(u => u.level === 'intermediate').length,
        pro: userScores.filter(u => u.level === 'pro').length,
        expert: userScores.filter(u => u.level === 'expert').length,
        master: userScores.filter(u => u.level === 'master').length,
      }

      // Weekly trend
      const weeklyTrend = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
        const dayCleanups = filteredCleanups.filter(c => {
          const cDate = c.createdAt?.toDate?.() || new Date(c.createdAt)
          return cDate >= date && cDate < nextDate
        })
        weeklyTrend.push({
          date: date.toLocaleDateString('tr-TR', { weekday: 'short', month: 'short', day: 'numeric' }),
          count: dayCleanups.length,
          score: dayCleanups.reduce((sum, c) => sum + (c.earnedPoints || 0), 0),
        })
      }

      setStats({
        totalUsers,
        totalCleanups,
        averageScore,
        totalPoints,
        topScorer,
        scoreDistribution,
        factorBreakdown,
        difficultyStats,
        urgencyStats,
        teamEfficiency,
        badgeDistribution,
        levelDistribution,
        weeklyTrend,
      })
    } catch (error) {
      console.error('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
        Analitikler yükleniyor...
      </div>
    )
  }

  const StatCard = ({ label, value, icon, color = theme.colors.primary }) => (
    <div
      style={{
        background: 'white',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        boxShadow: theme.shadows.sm,
        border: `1px solid ${theme.colors.light}`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 24, marginBottom: theme.spacing.sm }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>
        {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
      </div>
      <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: theme.spacing.xs }}>
        {label}
      </div>
    </div>
  )

  const ChartBar = ({ label, value, max, color = theme.colors.primary }) => (
    <div style={{ marginBottom: theme.spacing.md }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>{value}</span>
      </div>
      <div
        style={{
          height: 24,
          background: theme.colors.light,
          borderRadius: theme.radius.sm,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: color,
            width: `${(value / max) * 100}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )

  const maxScoreCount = Math.max(...Object.values(stats.scoreDistribution))
  const maxDiffCount = Math.max(...Object.values(stats.difficultyStats))
  const maxUrgCount = Math.max(...Object.values(stats.urgencyStats))
  const maxTeamCount = Math.max(...Object.values(stats.teamEfficiency))

  return (
    <div style={{ padding: theme.spacing.xl }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.xl,
        }}
      >
        <h1 style={{ ...theme.typography.sizes.xl, fontWeight: 700 }}>📊 Analitikler</h1>
        <div style={{ display: 'flex', gap: theme.spacing.md }}>
          {['all', 'month', 'week'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                background: selectedPeriod === period ? theme.colors.primary : theme.colors.light,
                color: selectedPeriod === period ? 'white' : theme.colors.text,
                border: 'none',
                borderRadius: theme.radius.sm,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {period === 'all' && 'Tüm Zamanlar'}
              {period === 'month' && 'Bu Ay'}
              {period === 'week' && 'Bu Hafta'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: theme.spacing.lg,
          marginBottom: theme.spacing.xl,
        }}
      >
        <StatCard label="Toplam Temizlik" value={stats.totalCleanups} icon="🧹" color={theme.colors.primary} />
        <StatCard label="Aktif Kullanıcı" value={stats.totalUsers} icon="👥" color={theme.colors.success} />
        <StatCard label="Orta. Puan" value={stats.averageScore} icon="⭐" color={theme.colors.warning} />
        <StatCard label="Toplam Puan" value={stats.totalPoints} icon="🏆" color={theme.colors.danger} />
      </div>

      {/* Top Scorer */}
      {stats.topScorer && (
        <div
          style={{
            background: 'white',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.xl,
            boxShadow: theme.shadows.sm,
            border: `1px solid ${theme.colors.light}`,
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: theme.spacing.md }}>🥇 En Yüksek Puan</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <div
              style={{
                fontSize: 32,
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.colors.light,
                borderRadius: theme.radius.md,
              }}
            >
              🌟
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{stats.topScorer.userName || 'Anonymous'}</div>
              <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                {stats.topScorer.totalScore} puan • {stats.topScorer.badge} badge • {stats.topScorer.level} level
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: theme.spacing.lg,
          marginBottom: theme.spacing.xl,
        }}
      >
        {/* Score Distribution */}
        <div
          style={{
            background: 'white',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            boxShadow: theme.shadows.sm,
            border: `1px solid ${theme.colors.light}`,
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: theme.spacing.md }}>📈 Puan Dağılımı</h3>
          {Object.entries(stats.scoreDistribution).map(([range, count]) => (
            <ChartBar key={range} label={range} value={count} max={maxScoreCount} color={theme.colors.primary} />
          ))}
        </div>

        {/* Difficulty Distribution */}
        <div
          style={{
            background: 'white',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            boxShadow: theme.shadows.sm,
            border: `1px solid ${theme.colors.light}`,
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: theme.spacing.md }}>💪 Zorluk Seviyeleri</h3>
          {[1, 2, 3, 4, 5].map(level => (
            <ChartBar
              key={level}
              label={`Seviye ${level} ${'⭐'.repeat(level)}`}
              value={stats.difficultyStats[level]}
              max={maxDiffCount}
              color={`hsl(${60 - level * 10}, 70%, 50%)`}
            />
          ))}
        </div>

        {/* Urgency Distribution */}
        <div
          style={{
            background: 'white',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            boxShadow: theme.shadows.sm,
            border: `1px solid ${theme.colors.light}`,
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: theme.spacing.md }}>⏰ Aciliyet Seviyeleri</h3>
          {[1, 2, 3, 4, 5].map(level => (
            <ChartBar
              key={level}
              label={`Seviye ${level}`}
              value={stats.urgencyStats[level]}
              max={maxUrgCount}
              color={`hsl(${10 + level * 10}, 70%, 50%)`}
            />
          ))}
        </div>

        {/* Team Composition */}
        <div
          style={{
            background: 'white',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            boxShadow: theme.shadows.sm,
            border: `1px solid ${theme.colors.light}`,
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: theme.spacing.md }}>👥 Takım Yapısı</h3>
          <ChartBar
            label="Solo (1 kişi)"
            value={stats.teamEfficiency.solo}
            max={maxTeamCount}
            color={theme.colors.primary}
          />
          <ChartBar
            label="Küçük (2-3)"
            value={stats.teamEfficiency.small}
            max={maxTeamCount}
            color={theme.colors.success}
          />
          <ChartBar
            label="Orta (4-5)"
            value={stats.teamEfficiency.medium}
            max={maxTeamCount}
            color={theme.colors.warning}
          />
          <ChartBar label="Büyük (6+)" value={stats.teamEfficiency.large} max={maxTeamCount} color={theme.colors.danger} />
        </div>

        {/* Badge Distribution */}
        <div
          style={{
            background: 'white',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            boxShadow: theme.shadows.sm,
            border: `1px solid ${theme.colors.light}`,
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: theme.spacing.md }}>🏅 Badge Dağılımı</h3>
          {Object.entries(stats.badgeDistribution).map(([badge, count]) => (
            <ChartBar
              key={badge}
              label={badge.charAt(0).toUpperCase() + badge.slice(1)}
              value={count}
              max={stats.totalUsers}
              color={
                badge === 'bronze'
                  ? '#CD7F32'
                  : badge === 'silver'
                    ? '#C0C0C0'
                    : badge === 'gold'
                      ? '#FFD700'
                      : '#E5E4E2'
              }
            />
          ))}
        </div>

        {/* Level Distribution */}
        <div
          style={{
            background: 'white',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            boxShadow: theme.shadows.sm,
            border: `1px solid ${theme.colors.light}`,
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: theme.spacing.md }}>⭐ Level Dağılımı</h3>
          {Object.entries(stats.levelDistribution).map(([level, count], idx) => (
            <ChartBar
              key={level}
              label={level.charAt(0).toUpperCase() + level.slice(1)}
              value={count}
              max={stats.totalUsers}
              color={`hsl(${idx * 40}, 70%, 50%)`}
            />
          ))}
        </div>
      </div>

      {/* Weekly Trend */}
      <div
        style={{
          background: 'white',
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          boxShadow: theme.shadows.sm,
          border: `1px solid ${theme.colors.light}`,
        }}
      >
        <h3 style={{ fontWeight: 700, marginBottom: theme.spacing.md }}>📅 7 Günlük Trend</h3>
        <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {stats.weeklyTrend.map((day, idx) => {
            const maxScore = Math.max(...stats.weeklyTrend.map(d => d.score), 1)
            const height = (day.score / maxScore) * 200
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 12, marginBottom: theme.spacing.sm, color: theme.colors.textSecondary }}>
                  {day.score}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: Math.max(height, 10),
                    background: theme.colors.primary,
                    borderRadius: `${theme.radius.sm} ${theme.radius.sm} 0 0`,
                    transition: 'height 0.3s ease',
                  }}
                />
                <div style={{ fontSize: 11, marginTop: theme.spacing.sm, textAlign: 'center' }}>
                  {day.date}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
