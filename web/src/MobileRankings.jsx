import React, { useState, useEffect } from 'react'
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

export default function MobileRankings({ onBack }) {
  const [filter, setFilter] = useState('genel')
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!window.firestore) return
    
    const unsub = watchLeaderboard(window.firestore, (data) => {
      setLeaderboard(data)
      setLoading(false)
    })

    return unsub
  }, [])

  const topThree = leaderboard.slice(0, 3)
  const remaining = leaderboard.slice(3)

  return (
    <div className="mobile-app" style={{ background: '#fff', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: '#10b981', padding: '16px', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', width: 40, height: 40, borderRadius: '50%', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Sıralama</div>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Filter Toggle */}
      <div style={{ background: '#10b981', padding: '0 20px 30px 20px', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
        <div style={{ background: '#fff', borderRadius: 99, padding: 4, display: 'flex' }}>
          <button
            onClick={() => setFilter('haftalik')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 99,
              border: 'none',
              background: filter === 'haftalik' ? '#fff' : 'transparent',
              color: filter === 'haftalik' ? '#10b981' : '#6b7280',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: filter === 'haftalik' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Haftalık
          </button>
          <button
            onClick={() => setFilter('genel')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 99,
              border: 'none',
              background: filter === 'genel' ? '#10b981' : 'transparent',
              color: filter === 'genel' ? '#fff' : '#6b7280',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: filter === 'genel' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Genel
          </button>
        </div>
      </div>

      <div style={{ padding: 20 }}>

      {/* Podium */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 40, marginTop: 20 }}>
          {/* Rank 2 */}
          {topThree[1] && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: -20, zIndex: 1 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#d1d5db', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: -15, zIndex: 2 }}>
                {topThree[1].avatar || '👤'}
              </div>
              <div style={{ background: '#d1d5db', width: 30, height: 30, borderRadius: '50%', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, zIndex: 3, color: '#fff', fontSize: 14 }}>
                🥈
              </div>
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{topThree[1].userName}</div>
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>{topThree[1].totalScore} DP</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>{getBadgeEmoji(topThree[1].badge)} {getLevelEmoji(topThree[1].level)}</div>
              </div>
            </div>
          )}

          {/* Rank 1 */}
          {topThree[0] && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', color: '#fbbf24', zIndex: 10 }} width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#fbbf24', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: -15, boxShadow: '0 10px 20px rgba(251, 191, 36, 0.3)' }}>
                  {topThree[0].avatar || '👤'}
                </div>
              </div>
              <div style={{ background: '#fbbf24', width: 36, height: 36, borderRadius: '50%', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, zIndex: 3, color: '#fff', fontSize: 16 }}>
                🥇
              </div>
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{topThree[0].userName}</div>
                <div style={{ fontSize: 14, color: '#10b981', fontWeight: 700 }}>{topThree[0].totalScore} DP</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>{getBadgeEmoji(topThree[0].badge)} {getLevelEmoji(topThree[0].level)}</div>
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {topThree[2] && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: -20, zIndex: 1 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#d68f5c', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: -15, zIndex: 2 }}>
                {topThree[2].avatar || '👤'}
              </div>
              <div style={{ background: '#d68f5c', width: 30, height: 30, borderRadius: '50%', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, zIndex: 3, color: '#fff', fontSize: 14 }}>
                🥉
              </div>
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{topThree[2].userName}</div>
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>{topThree[2].totalScore} DP</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>{getBadgeEmoji(topThree[2].badge)} {getLevelEmoji(topThree[2].level)}</div>
              </div>
            </div>
          )}
        </div>

        {/* List Title */}
        <h3 style={{ fontSize: 16, fontWeight: 800, marginTop: 10, marginBottom: 16 }}>Tüm Sıralama</h3>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            Yükleniyor...
          </div>
        )}

        {/* List Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {remaining.map((user) => (
            <div key={user.userId} style={{
              background: '#fff',
              borderRadius: 20,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              border: '1px solid #f3f4f6'
            }}>
              <div style={{ width: 30, fontSize: 16, fontWeight: 700, color: '#9ca3af', textAlign: 'center' }}>{user.rank}</div>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginRight: 16 }}>
                {user.avatar || '👤'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#1f2937' }}>{user.userName}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{user.totalScore} DP • {user.cleanupCount} görev</div>
              </div>
              <div style={{ display: 'flex', gap: 4, fontSize: 16 }}>
                <span>{getBadgeEmoji(user.badge)}</span>
                <span>{getLevelEmoji(user.level)}</span>
              </div>
            </div>
          ))}
          {remaining.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              Henüz sıralama verisi yok
            </div>
          )}
        </div>

      </div>

      {/* Sticky User Footer */}
      <div style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        background: '#10b981',
        borderRadius: 24,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#fff',
        boxShadow: '0 10px 20px rgba(16, 185, 129, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {USER_DATA.avatar}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>SEN</span>
              <span style={{ fontWeight: 700 }}>Sıralaman</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>Liderle aranda 3,425 DP var</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>#{USER_DATA.rank}</div>
          <div style={{ fontSize: 11, fontWeight: 700 }}>{USER_DATA.points} DP</div>
        </div>
      </div>

    </div>
  )
}
