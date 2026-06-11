/**
 * 🏠 Modern Dashboard Component
 * Responsive Web Dashboard - Mobile Friendly
 */

import React, { useState, useEffect } from 'react'
import theme from './theme'
import { Card, Button, StatCard, Grid, ProgressBar, Badge, Alert } from './components'

const ModernDashboard = ({ user, stats = {} }) => {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.light, padding: theme.spacing.xl }}>
      {/* 🎨 Header Section */}
      <div
        style={{
          background: theme.gradients.primary,
          color: theme.colors.white,
          padding: theme.spacing['2xl'],
          borderRadius: theme.radius.xl,
          marginBottom: theme.spacing['2xl'],
          boxShadow: theme.shadows.lg,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: theme.typography.sizes['3xl'], fontWeight: 700 }}>
              🌍 Hoşgeldiniz, {user?.name || 'Gönüllü'}!
            </h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
              Çevre temizliği kampanyasına katkı sağlıyorsunuz
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: theme.typography.sizes['2xl'], fontWeight: 700 }}>
              {stats.totalPoints || 0} EP
            </div>
            <small style={{ opacity: 0.8 }}>Toplam Puan</small>
          </div>
        </div>
      </div>

      {/* 📊 Stats Grid */}
      <div style={{ marginBottom: theme.spacing['2xl'] }}>
        <h2 style={{ marginBottom: theme.spacing.lg, color: theme.colors.text.primary }}>
          📈 İstatistikler
        </h2>
        <Grid columns={4}>
          <StatCard
            icon="👥"
            label="Gönüllüler"
            value={stats.volunteers || 0}
            color="primary"
            gradient
          />
          <StatCard
            icon="🎯"
            label="Aktif Görevler"
            value={stats.activeTasks || 0}
            color="secondary"
          />
          <StatCard
            icon="✅"
            label="Tamamlanan"
            value={stats.completed || 0}
            color="success"
          />
          <StatCard
            icon="🏆"
            label="Sıra"
            value={stats.rank || '-'}
            color="warning"
          />
        </Grid>
      </div>

      {/* 🎯 Progress Section */}
      <Card style={{ marginBottom: theme.spacing['2xl'] }}>
        <h3 style={{ marginBottom: theme.spacing.lg, color: theme.colors.text.primary }}>
          🚀 Seviye İlerleme
        </h3>
        <ProgressBar
          value={stats.levelProgress || 35}
          max={100}
          color="primary"
          label="Sonraki Seviye"
        />
        <div style={{ marginTop: theme.spacing.lg, fontSize: theme.typography.sizes.sm }}>
          <p style={{ color: theme.colors.text.secondary, margin: 0 }}>
            {stats.levelProgress || 35}/100 EP • <strong>65 EP kaldı</strong>
          </p>
        </div>
      </Card>

      {/* 🔔 Recent Activity */}
      <Card>
        <h3 style={{ marginBottom: theme.spacing.lg, color: theme.colors.text.primary }}>
          📋 Son Aktiviteler
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {[
            { icon: '✅', title: 'Görev Tamamlandı', subtitle: 'Kızılay Temizliği - 50 EP kazandı', time: '2 sa. önce' },
            { icon: '👥', title: 'Gruba Katıldı', subtitle: 'Ankara Gönüllüleri grubuna eklendi', time: '1 gün önce' },
            { icon: '🌟', title: 'Badge Açıldı', subtitle: 'Aşçı Rozetini kazandı', time: '3 gün önce' },
          ].map((activity, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: theme.spacing.md,
                background: theme.colors.light,
                borderRadius: theme.radius.md,
                gap: theme.spacing.md,
              }}
            >
              <span style={{ fontSize: '24px' }}>{activity.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: theme.typography.weights.semibold }}>
                  {activity.title}
                </div>
                <small style={{ color: theme.colors.text.secondary }}>
                  {activity.subtitle}
                </small>
              </div>
              <small style={{ color: theme.colors.text.tertiary }}>{activity.time}</small>
            </div>
          ))}
        </div>
      </Card>

      {/* 🎛️ Tab Navigation */}
      <div style={{ marginTop: theme.spacing['2xl'], display: 'flex', gap: theme.spacing.md }}>
        {['overview', 'tasks', 'badges', 'leaderboard'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              borderRadius: theme.radius.md,
              border: 'none',
              background: activeTab === tab ? theme.colors.primary : theme.colors.light,
              color: activeTab === tab ? theme.colors.white : theme.colors.text.primary,
              fontWeight: theme.typography.weights.semibold,
              cursor: 'pointer',
              transition: `all ${theme.transitions.base}`,
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ModernDashboard
