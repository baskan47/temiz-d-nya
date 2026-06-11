import React, { useState } from 'react'
import theme from './theme'
import ProfessionalMap from './ProfessionalMap'
import ActiveTasks from './ActiveTasks'
import GroupManagement from './GroupManagement'
import LiveOperations from './LiveOperations'
import { NotificationCenter, PhotoProofSystem } from './NotificationCenter'

/**
 * 📱 Profesyonel Temiz Dünya Uygulaması
 */
const MobileTest = () => {
  const [activeTab, setActiveTab] = useState('home')
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showScoreMenu, setShowScoreMenu] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(3)

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.light,
      fontFamily: theme.typography.fonts.main,
    }}>
      {/* Header */}
      <div style={{
        background: theme.gradients.primary,
        color: 'white',
        padding: theme.spacing.lg,
        paddingTop: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ margin: '0 0 ' + theme.spacing.sm + ' 0', fontSize: 24, fontWeight: 700 }}>
            🌍 Temiz Dünya
          </h1>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.9 }}>
            Profesyonel Çevre Temizlik Platformu
          </p>
        </div>
        
        {/* Header Icons */}
        <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center', minWidth: 80 }}>
          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: theme.spacing.md,
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                fontSize: 18,
                transition: 'all 0.3s ease',
                position: 'relative',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              🔔
              {unreadNotifications > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: theme.colors.error,
                  color: 'white',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                }}>
                  {unreadNotifications}
                </div>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'white',
                borderRadius: theme.radius.lg,
                boxShadow: theme.shadows.lg,
                width: 300,
                maxHeight: 400,
                overflow: 'auto',
                zIndex: 1000,
                marginTop: theme.spacing.sm,
              }}>
                <div style={{
                  padding: theme.spacing.md,
                  borderBottom: `1px solid ${theme.colors.light}`,
                  fontWeight: 700,
                  color: theme.colors.dark,
                }}>
                  Bildirimler
                </div>
                {[
                  { icon: '🎯', title: 'Yeni Görev', msg: 'Meles Deresi temizliğine katıl' },
                  { icon: '👥', title: 'Grup Güncelleme', msg: '5 yeni üye katıldı' },
                  { icon: '🏆', title: 'Başarı Açıldı', msg: 'Çevre Kahramanı rozeti!' },
                ].map((notif, i) => (
                  <div
                    key={i}
                    style={{
                      padding: theme.spacing.md,
                      borderBottom: i < 2 ? `1px solid ${theme.colors.light}` : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.3s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = theme.colors.light}
                    onMouseOut={e => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                      <span style={{ fontSize: 18 }}>{notif.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: theme.colors.dark }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>
                          {notif.msg}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: theme.spacing.lg, paddingBottom: 100 }}>
        {activeTab === 'home' && <HomePage setActiveTab={setActiveTab} />}
        {activeTab === 'map' && <ProfessionalMap />}
        {activeTab === 'groups' && <GroupManagement />}
        {activeTab === 'operations' && <LiveOperations />}
        {activeTab === 'photos' && <PhotoProofSystem />}
        {activeTab === 'scores' && <ScoresPage />}
        {activeTab === 'rankings' && <RankingsPage />}
        {activeTab === 'emergency' && <EmergencyPage />}
        {activeTab === 'settings' && (
          <SettingsPage 
            notifications={notifications}
            setNotifications={setNotifications}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: `1px solid ${theme.colors.light}`,
        display: 'flex',
        justifyContent: 'space-around',
        padding: theme.spacing.sm,
        boxShadow: theme.shadows.lg,
        overflowX: 'auto',
      }}>
        {[
          { id: 'groups', icon: '👥', label: 'Gruplar' },
          { id: 'map', icon: '🗺️', label: 'Harita' },
          { id: 'home', icon: '🏠', label: 'Anasayfa' },
          { id: 'emergency', icon: '🆘', label: 'Acil Durum' },
          { id: 'settings', icon: '⚙️', label: 'Ayarlar' },
        ].map(tab => (
          <div key={tab.id} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                if (tab.id === 'scores') {
                  setShowScoreMenu(!showScoreMenu)
                } else {
                  setActiveTab(tab.id)
                  setShowScoreMenu(false)
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: theme.spacing.md,
                cursor: 'pointer',
                color: (activeTab === tab.id || activeTab === 'scores' || activeTab === 'rankings') && tab.id === 'scores' ? theme.colors.primary : theme.colors.textSecondary,
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: (activeTab === tab.id || (tab.id === 'scores' && (activeTab === 'scores' || activeTab === 'rankings'))) ? 700 : 500,
                whiteSpace: 'nowrap',
                minWidth: 'fit-content',
              }}
            >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>

            {/* Score Menu Dropdown */}
            {tab.id === 'scores' && showScoreMenu && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'white',
                borderRadius: theme.radius.lg,
                boxShadow: theme.shadows.lg,
                overflow: 'hidden',
                zIndex: 1000,
                minWidth: 150,
                marginBottom: theme.spacing.sm,
              }}>
                <button
                  onClick={() => {
                    setActiveTab('scores')
                    setShowScoreMenu(false)
                  }}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    background: activeTab === 'scores' ? theme.colors.primary + '20' : 'white',
                    color: activeTab === 'scores' ? theme.colors.primary : theme.colors.dark,
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: activeTab === 'scores' ? 700 : 500,
                    transition: 'all 0.3s',
                    borderBottom: `1px solid ${theme.colors.light}`,
                  }}
                  onMouseOver={e => e.currentTarget.style.background = theme.colors.light}
                  onMouseOut={e => e.currentTarget.style.background = activeTab === 'scores' ? theme.colors.primary + '20' : 'white'}
                >
                  ⭐ Puanlarım
                </button>
                <button
                  onClick={() => {
                    setActiveTab('rankings')
                    setShowScoreMenu(false)
                  }}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    background: activeTab === 'rankings' ? theme.colors.primary + '20' : 'white',
                    color: activeTab === 'rankings' ? theme.colors.primary : theme.colors.dark,
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: activeTab === 'rankings' ? 700 : 500,
                    transition: 'all 0.3s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = theme.colors.light}
                  onMouseOut={e => e.currentTarget.style.background = activeTab === 'rankings' ? theme.colors.primary + '20' : 'white'}
                >
                  🏆 Sıralama
                </button>
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}

/* ========== SAYFA BİLEŞENLERİ ========== */

const HomePage = ({ setActiveTab }) => {
  const [showAllTasks, setShowAllTasks] = useState(false)

  if (showAllTasks) {
    return (
      <div>
        <button
          onClick={() => setShowAllTasks(false)}
          style={{
            background: theme.colors.light,
            border: 'none',
            padding: theme.spacing.md,
            borderRadius: theme.radius.md,
            cursor: 'pointer',
            fontWeight: 700,
            marginBottom: theme.spacing.lg,
            color: theme.colors.primary,
          }}
        >
          ← Geri
        </button>
        <ActiveTasks />
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <h2 style={{ color: theme.colors.dark, margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Dashboard
        </h2>
        <div style={{ fontSize: 14, color: theme.colors.textSecondary, fontWeight: 500 }}>
          {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* İstatistikler - Premium Görünüm */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
        <StatCard color="#4facfe" icon="👥" label="Aktif Gönüllü" value="1.284" trend="+12%" />
        <StatCard color="#43e97b" icon="🌿" label="Temizlenen Alan" value="12.4 km²" trend="+5.2%" />
        <StatCard color="#fa709a" icon="🎯" label="Aktif Görev" value="48" trend="Canlı" />
        <StatCard color="#f6d365" icon="🏆" label="Toplam Puan" value="84.2k" trend="+2.4k" />
      </div>

      {/* Canlı Aktivite Akışı (Live Feed) */}
      <div style={{
        background: 'white',
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        marginBottom: theme.spacing.xl,
        border: '1px solid rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: theme.spacing.lg }}>
          <div style={{ width: 10, height: 10, background: '#ff4b2b', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
          <h3 style={{ color: theme.colors.dark, margin: 0, fontSize: 18, fontWeight: 700 }}>
            Canlı Aktivite
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          <ActivityItem user="Ahmet Y." action="Konak Meydanı'nı temizledi" time="2 dk önce" points="+50" />
          <ActivityItem user="Zeynep K." action="Yeni bir kirlilik raporladı" time="5 dk önce" points="+10" />
          <ActivityItem user="Meles Grubu" action="Görev tamamlandı!" time="12 dk önce" points="+500" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: theme.spacing.lg }}>
        {/* Yakındaki Görevler */}
        <div style={{
          background: 'white',
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
            <h3 style={{ color: theme.colors.dark, margin: 0, fontSize: 18, fontWeight: 700 }}>
              🎯 Yakındaki Görevler
            </h3>
            <button
              onClick={() => setShowAllTasks(true)}
              style={{
                background: 'transparent',
                color: theme.colors.primary,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Tümünü Gör
            </button>
          </div>
          <div>
            <TaskPreview emoji="🗑️" title="Meles Deresi Temizliği" location="Alsancak" dist="0.8 km" volunteers="12" />
            <TaskPreview emoji="🌳" title="Çankaya Bahçe Bakımı" location="Konak" dist="1.2 km" volunteers="8" />
            <TaskPreview emoji="♻️" title="Atık Toplama" location="Alsancak" dist="2.5 km" volunteers="15" last />
          </div>
        </div>

        {/* Hızlı İşlemler */}
        <div style={{
          background: 'white',
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.03)',
        }}>
          <h3 style={{ color: theme.colors.dark, margin: '0 0 ' + theme.spacing.lg + ' 0', fontSize: 18, fontWeight: 700 }}>
            ⚡ Hızlı İşlemler
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.md }}>
            <QuickActionBtn icon="📊" label="Operasyon" color="#4facfe" onClick={() => setActiveTab('operations')} />
            <QuickActionBtn icon="📸" label="Kanıt Yükle" color="#f093fb" onClick={() => setActiveTab('photos')} />
            <QuickActionBtn icon="🏆" label="Sıralama" color="#f6d365" onClick={() => setActiveTab('scores')} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 75, 43, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(255, 75, 43, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 75, 43, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

const StatCard = ({ color, icon, label, value, trend }) => (
  <div style={{
    background: `linear-gradient(135deg, ${color}20 0%, white 100%)`,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    border: `1px solid ${color}30`,
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: theme.colors.dark, marginTop: 4 }}>{value}</div>
    <div style={{ 
      position: 'absolute', 
      top: 15, 
      right: 15, 
      fontSize: 10, 
      fontWeight: 700, 
      background: trend.startsWith('+') ? '#43e97b20' : '#4facfe20',
      color: trend.startsWith('+') ? '#2e7d32' : '#1976d2',
      padding: '4px 8px',
      borderRadius: 20
    }}>
      {trend}
    </div>
  </div>
)

const ActivityItem = ({ user, action, time, points }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8f9fa' }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 32, height: 32, background: theme.colors.light, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: theme.colors.primary }}>
        {user[0]}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.dark }}>{user} <span style={{ fontWeight: 400, color: theme.colors.textSecondary }}>{action}</span></div>
        <div style={{ fontSize: 11, color: '#adb5bd' }}>{time}</div>
      </div>
    </div>
    <div style={{ fontSize: 12, fontWeight: 700, color: '#43e97b' }}>{points} EP</div>
  </div>
)

const QuickActionBtn = ({ icon, label, color, onClick }) => (
  <button 
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      padding: theme.spacing.md,
      background: 'white',
      border: '1px solid #f1f3f5',
      borderRadius: theme.radius.lg,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
    onMouseOver={e => {
      e.currentTarget.style.transform = 'translateY(-3px)'
      e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.05)'
      e.currentTarget.style.borderColor = color
    }}
    onMouseOut={e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
      e.currentTarget.style.borderColor = '#f1f3f5'
    }}
  >
    <div style={{ fontSize: 24 }}>{icon}</div>
    <div style={{ fontSize: 11, fontWeight: 700, color: theme.colors.textSecondary }}>{label}</div>
  </button>
)

const TaskPreview = ({ emoji, title, location, dist, volunteers, last }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: '16px 0',
      borderBottom: last ? 'none' : `1px solid #f1f3f5`,
      cursor: 'pointer',
      transition: 'transform 0.2s',
    }}
    onMouseOver={e => e.currentTarget.style.transform = 'translateX(5px)'}
    onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}
  >
    <div style={{ 
      width: 48, 
      height: 48, 
      background: '#f8f9fa', 
      borderRadius: 12, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: 24 
    }}>
      {emoji}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: theme.colors.dark }}>{title}</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>📍 {location} ({dist})</div>
        <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>👥 {volunteers} kişi</div>
      </div>
    </div>
    <div style={{ color: theme.colors.primary, fontWeight: 800, fontSize: 18 }}>→</div>
  </div>
)

const ScoresPage = () => (
  <div>
    <h2 style={{ color: theme.colors.dark, marginBottom: theme.spacing.lg, fontSize: 20, fontWeight: 700 }}>
      ⭐ Puanlarım
    </h2>
    <div style={{
      background: theme.gradients.primary,
      color: 'white',
      padding: theme.spacing.xl,
      borderRadius: theme.radius.lg,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    }}>
      <div style={{ fontSize: 48, marginBottom: theme.spacing.md }}>🏆</div>
      <div style={{ fontSize: 14, opacity: 0.9, marginBottom: theme.spacing.sm }}>
        Toplam Puanlarım
      </div>
      <div style={{ fontSize: 36, fontWeight: 700 }}>3250</div>
      <div style={{ fontSize: 12, marginTop: theme.spacing.md, opacity: 0.8 }}>
        Sıra: #2 · Bu Ay: +450
      </div>
    </div>
    <div style={{ background: 'white', padding: theme.spacing.lg, borderRadius: theme.radius.lg, boxShadow: theme.shadows.md }}>
      <div style={{ marginBottom: theme.spacing.md }}>
        <p style={{ margin: '0 0 ' + theme.spacing.sm + ' 0', color: theme.colors.textSecondary, fontSize: 12 }}>
          🥇 Çevre Kahramanı
        </p>
        <div style={{ width: '100%', height: 8, background: theme.colors.light, borderRadius: theme.radius.sm, overflow: 'hidden' }}>
          <div style={{ width: '85%', height: '100%', background: theme.colors.success }} />
        </div>
      </div>
      <div style={{ marginBottom: theme.spacing.md }}>
        <p style={{ margin: '0 0 ' + theme.spacing.sm + ' 0', color: theme.colors.textSecondary, fontSize: 12 }}>
          🌟 Lider
        </p>
        <div style={{ width: '100%', height: 8, background: theme.colors.light, borderRadius: theme.radius.sm, overflow: 'hidden' }}>
          <div style={{ width: '45%', height: '100%', background: theme.colors.primary }} />
        </div>
      </div>
    </div>
  </div>
)

const RankingsPage = () => (
  <div>
    <h2 style={{ color: theme.colors.dark, marginBottom: theme.spacing.lg, fontSize: 20, fontWeight: 700 }}>
      🏆 Sıralama
    </h2>
    <div style={{ background: 'white', padding: theme.spacing.lg, borderRadius: theme.radius.lg, boxShadow: theme.shadows.md }}>
      {[
        { rank: 1, emoji: '🥇', name: 'Ali Kaya', points: '4850' },
        { rank: 2, emoji: '🥈', name: 'Zeynep Yıldız', points: '4200' },
        { rank: 3, emoji: '🥉', name: 'Mehmet Çapar', points: '3800' },
        { rank: 4, emoji: '4️⃣', name: 'Ayşe Demir', points: '3250' },
        { rank: 5, emoji: '5️⃣', name: 'Fatih Esen', points: '2900' },
      ].map(item => (
        <div
          key={item.rank}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: theme.spacing.md,
            borderBottom: item.rank < 5 ? `1px solid ${theme.colors.light}` : 'none',
            gap: theme.spacing.md,
          }}
        >
          <span style={{ fontSize: 20, minWidth: 30 }}>{item.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: theme.colors.dark }}>{item.name}</div>
          </div>
          <span style={{ fontWeight: 700, color: theme.colors.primary, fontSize: 14 }}>
            {item.points}
          </span>
        </div>
      ))}
    </div>
  </div>
)

const EmergencyPage = () => (
  <div>
    <h2 style={{ color: theme.colors.error, marginBottom: theme.spacing.lg, fontSize: 20, fontWeight: 700 }}>
      🚨 Acil Durum
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
      <EmergencyButton emoji="🚔" label="Polis" phone="112" onClick={() => { alert('112 Polis çağrılıyor'); window.location.href = 'tel:112' }} />
      <EmergencyButton emoji="🚒" label="İtfaiye" phone="110" onClick={() => { alert('110 İtfaiye çağrılıyor'); window.location.href = 'tel:110' }} />
      <EmergencyButton emoji="🚑" label="Ambulans" phone="115" onClick={() => { alert('115 Ambulans çağrılıyor'); window.location.href = 'tel:115' }} />
      <EmergencyButton emoji="☠️" label="Zehir İnf." phone="114" onClick={() => { alert('114 Zehir İnfeksiyonu'); window.location.href = 'tel:114' }} />
    </div>
  </div>
)

const SettingsPage = ({ notifications, setNotifications, darkMode, setDarkMode }) => (
  <div>
    <h2 style={{ color: theme.colors.dark, marginBottom: theme.spacing.lg, fontSize: 20, fontWeight: 700 }}>
      ⚙️ Ayarlar
    </h2>
    <div style={{ background: 'white', padding: theme.spacing.lg, borderRadius: theme.radius.lg, boxShadow: theme.shadows.md }}>
      <SettingOption
        emoji="🔔"
        label="Bildirimler"
        value={notifications ? '✅ Açık' : '❌ Kapalı'}
        onClick={() => setNotifications(!notifications)}
      />
      <SettingOption
        emoji="🌙"
        label="Koyu Mod"
        value={darkMode ? '✅ Açık' : '❌ Kapalı'}
        onClick={() => setDarkMode(!darkMode)}
      />
      <SettingOption
        emoji="🌍"
        label="Dil"
        value="Türkçe"
        onClick={() => alert('🌍 Dil: Türkçe')}
      />
      <SettingOption
        emoji="📱"
        label="Sürüm"
        value="2.0.0"
        onClick={() => alert('📱 Sürüm: 2.0.0')}
      />
      <SettingOption
        emoji="🚪"
        label="Çıkış"
        value="→"
        onClick={() => alert('👋 Çıkış yapıldı!')}
        last
      />
    </div>
  </div>
)

/* ========== KÜÇÜK BİLEŞENLER ========== */

const StatBox = ({ emoji, label, value }) => (
  <div style={{
    background: theme.colors.light,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    textAlign: 'center',
  }}>
    <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
    <div style={{ fontSize: 10, color: theme.colors.textSecondary, marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 16, fontWeight: 700, color: theme.colors.primary }}>
      {value}
    </div>
  </div>
)

const ActionButton = ({ emoji, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: 'white',
      border: `1px solid ${theme.colors.light}`,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
    }}
    onMouseOver={e => {
      e.currentTarget.style.background = theme.colors.light
      e.currentTarget.style.transform = 'scale(1.05)'
    }}
    onMouseOut={e => {
      e.currentTarget.style.background = 'white'
      e.currentTarget.style.transform = 'scale(1)'
    }}
  >
    <span style={{ fontSize: 24 }}>{emoji}</span>
    <span style={{ fontSize: 12, fontWeight: 600, color: theme.colors.dark }}>{label}</span>
  </button>
)

const SettingOption = ({ emoji, label, value, onClick, last }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderBottom: last ? 'none' : `1px solid ${theme.colors.light}`,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    }}
    onMouseOver={e => e.currentTarget.style.background = theme.colors.light}
    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span style={{ fontWeight: 600, color: theme.colors.dark }}>{label}</span>
    </div>
    <span style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{value}</span>
  </div>
)


export default MobileTest
