import React, { useEffect, useState } from 'react'
import './styles.css'
import { initFirebase } from './firebase-init'
import * as authService from './authService'
import { watchIncomingReports, watchVerificationPending, watchLiveOperations, approveVerification, rejectVerification, sendNotification } from './firestoreService'
import Map from './Map'
import AuthPanel from './AuthPanel'
import VolunteerGroups from './VolunteerGroups'
import FooterControls from './FooterControls'
import { watchRankings } from './groupService'
import AdminUsersPanel from './AdminUsersPanel'
import MobileHome from './MobileHome'
import MobileSettings from './MobileSettings'
import MobileGroups from './MobileGroups'
import MobileEmergency from './MobileEmergency'
import MobileRankings from './MobileRankings'
import MobileMapDetail from './MobileMapDetail'
import ImageAnalysis from './ImageAnalysis'
import ActiveCleanup from './ActiveCleanup'
import MobileScores from './MobileScores'
import ModernDashboard from './ModernDashboard'
import WebScores from './WebScores'
import WebRankings from './WebRankings'
import WebSettings from './WebSettings'

const SAMPLE_REPORTS = [
  { id: 'r-1', neighborhood: 'Kızılay', area: 120, status: 'open', date: '2025-12-23' },
  { id: 'r-2', neighborhood: 'Çankaya', area: 45, status: 'in_progress', date: '2025-12-22' },
  { id: 'r-3', neighborhood: 'Altındağ', area: 200, status: 'cleaned', date: '2025-12-20' }
]
const SAMPLE_VERIFICATIONS = [
  { id: 'v-1', photoUrl: 'https://picsum.photos/seed/p1/600/400', aiConfidence: 0.55, status: 'manual_review', createdAt: '2025-12-23' },
  { id: 'v-2', photoUrl: 'https://picsum.photos/seed/p2/600/400', aiConfidence: 0.65, status: 'manual_review', createdAt: '2025-12-22' }
]
const SAMPLE_OPERATIONS = [
  { id: 'op-1', group: 'G1', status: 'active', duration: '1h 20m', area: 340, weight: 120, members: 5 },
  { id: 'op-2', group: 'G2', status: 'paused', duration: '30m', area: 80, weight: 30, members: 3 }
]

function Header({ user }) {
  const [connected, setConnected] = useState(!!window.firebaseConnected)
  useEffect(() => {
    function onReady() { setConnected(true) }
    if (window.firebaseConnected) setConnected(true)
    document.addEventListener('firebase-ready', onReady)
    return () => document.removeEventListener('firebase-ready', onReady)
  }, [])
  return (
    <div className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h3 style={{ margin: 0 }}>Belediye Dashboard</h3>
        <small style={{ color: '#666' }}>Vite Demo</small>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{user.municipality}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, color: connected ? '#059669' : '#9ca3af' }}>{connected ? 'Firebase: Bağlı' : 'Firebase: Bağlı değil'}</div>
          <button style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6 }}>Çıkış</button>
        </div>
      </div>
    </div>
  )
}

function Sidebar({ active, onChange, collapsed, onToggle }) {
  return (
    <aside className={"sidebar" + (collapsed ? ' collapsed' : '')}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="logo">Pürdünya</div>
        <button onClick={onToggle} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>{collapsed ? '☰' : '✕'}</button>
      </div>
      <nav className="nav">
        <button className={active === 'dashboard' ? 'active' : ''} onClick={() => onChange('dashboard')}>{collapsed ? 'D' : 'Dashboard'}</button>
        <button className={active === 'scores' ? 'active' : ''} onClick={() => onChange('scores')}>{collapsed ? 'S' : 'Puanlar'}</button>
        <button className={active === 'rankings' ? 'active' : ''} onClick={() => onChange('rankings')}>{collapsed ? 'R' : 'Sıralama'}</button>
        <button className={active === 'settings' ? 'active' : ''} onClick={() => onChange('settings')}>{collapsed ? 'E' : 'Ayarlar'}</button>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '12px 0' }} />
        <button className={active === 'reports' ? 'active' : ''} onClick={() => onChange('reports')}>{collapsed ? 'R' : 'Raporlar'}</button>
        <button className={active === 'verification' ? 'active' : ''} onClick={() => onChange('verification')}>{collapsed ? 'V' : 'Doğrulama'}</button>
        <button className={active === 'operations' ? 'active' : ''} onClick={() => onChange('operations')}>{collapsed ? 'O' : 'Operasyonlar'}</button>
        <button className={active === 'stats' ? 'active' : ''} onClick={() => onChange('stats')}>{collapsed ? 'T' : 'İstatistikler'}</button>
        <button className={active === 'admin' ? 'active' : ''} onClick={() => onChange('admin')}>{collapsed ? 'K' : 'Kullanıcılar'}</button>
      </nav>
    </aside>
  )
}

function ReportsPanel({ reports, groups }) {
  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Gelen Raporlar</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: '#666' }}>Toplam: {reports.length}</div>
          <div>
            <button onClick={() => { exportCSV(reports) }} style={{ marginRight: 8 }}>CSV İndir</button>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Mahalle</th><th>Alan (m²)</th><th>Durum</th><th>Tarih</th></tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.neighborhood}</td>
                <td>{r.area}</td>
                <td>{r.status === 'open' ? <span className="badge open">Açık</span> : r.status === 'in_progress' ? <span className="badge in_progress">İşlemde</span> : <span className="badge cleaned">Temizlendi</span>}</td>
                <td>{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h4 style={{ marginTop: 0 }}>Harita</h4>
        <Map reports={reports} groups={groups} />
      </div>
    </div>
  )
}

function exportCSV(reports) {
  if (!reports || !reports.length) return
  const keys = Object.keys(reports[0])
  const rows = [keys.join(',')].concat(reports.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(',')))
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'reports.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function VerificationPanel({ items, onApprove, onReject }) {
  const [selected, setSelected] = useState(items[0] || null)
  useEffect(() => setSelected(items[0] || null), [items])
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ width: 260 }}>
        <div className="card">
          <h4>İnceleme Listesi</h4>
          {items.map(it => (
            <div key={it.id} style={{ padding: '8px 0', borderBottom: '1px dashed #eee', cursor: 'pointer' }} onClick={() => setSelected(it)}>
              <div style={{ fontWeight: 700 }}>{it.id}</div>
              <div style={{ fontSize: 13, color: '#666' }}>Güven: {(it.aiConfidence * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div className="card">
          {selected ? (
            <div>
              <img src={selected.photoUrl} alt="preview" style={{ width: '100%', borderRadius: 8, marginBottom: 8 }} />
              <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div><strong>ID:</strong> {selected.id}</div>
                  <div><strong>AI Güven:</strong> {(selected.aiConfidence * 100).toFixed(0)}%</div>
                  <div><strong>Tarih:</strong> {selected.createdAt}</div>
                </div>
                <div className="controls">
                  <button onClick={() => onReject(selected)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb' }}>Reddet</button>
                  <button onClick={() => onApprove(selected)} style={{ background: 'var(--blue)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6 }}>Onayla</button>
                </div>
              </div>
            </div>
          ) : (<div>İncelenecek fotoğraf yok</div>)}
        </div>
      </div>
    </div>
  )
}

function OperationsPanel({ operations }) {
  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <h4>Canlı Operasyonlar</h4>
        <div className="flex" style={{ justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: '#666' }}>Aktif Operasyon</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{operations.filter(o => o.status === 'active').length}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#666' }}>Toplam Alan (m²)</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{operations.reduce((s, o) => s + o.area, 0)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#666' }}>Toplam Atık (kg)</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{operations.reduce((s, o) => s + o.weight, 0)}</div>
          </div>
        </div>
      </div>
      <div className="card">
        <h4>Operasyon Detayları</h4>
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Grup</th><th>Durum</th><th>Süre</th><th>Alan</th><th>Ağırlık</th></tr>
          </thead>
          <tbody>
            {operations.map(op => (
              <tr key={op.id}><td>{op.id}</td><td>{op.group}</td><td>{op.status}</td><td>{op.duration}</td><td>{op.area}</td><td>{op.weight}kg</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatsPanel({ reports, operations }) {
  const cleaned = reports.filter(r => r.status === 'cleaned').length
  const avgArea = (reports.reduce((s, r) => s + r.area, 0) / reports.length).toFixed(1)
  return (
    <div className="grid">
      <div className="card">
        <h4>Açık Raporlar</h4>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{reports.filter(r => r.status === 'open').length}</div>
      </div>
      <div className="card">
        <h4>İşlemde</h4>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{reports.filter(r => r.status === 'in_progress').length}</div>
      </div>
      <div className="card">
        <h4>Temizlendi</h4>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{cleaned}</div>
      </div>
      <div className="card">
        <h4>Ort. Temizlik Alanı (m²)</h4>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{avgArea}</div>
      </div>
      <div className="card">
        <h4>Toplam Operasyon</h4>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{operations.length}</div>
      </div>
      <div className="card">
        <h4>Toplam Atık (kg)</h4>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{operations.reduce((s, o) => s + o.weight, 0)}</div>
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [reports, setReports] = useState(SAMPLE_REPORTS)
  const [verifications, setVerifications] = useState(SAMPLE_VERIFICATIONS)
  const [operations, setOperations] = useState(SAMPLE_OPERATIONS)
  const [groups, setGroups] = useState([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [viewMode, setViewMode] = useState('mobile') // 'mobile' or 'dashboard'

  useEffect(() => {
    function onAuthState() {
      if (window.auth && window.auth.currentUser) setUser(window.auth.currentUser)
    }
    document.addEventListener('firebase-ready', onAuthState)
    return () => document.removeEventListener('firebase-ready', onAuthState)
  }, [])

  useEffect(() => {
    initFirebase()
    const unsubs = []
    function startListeners() {
      if (window.firestore) {
        unsubs.push(watchIncomingReports(window.firestore, setReports))
        unsubs.push(watchVerificationPending(window.firestore, setVerifications))
        unsubs.push(watchLiveOperations(window.firestore, setOperations))
      }
    }
    if (window.firebaseConnected) startListeners()
    else {
      function onReady() { startListeners() }
      document.addEventListener('firebase-ready', onReady)
      // remove listener on cleanup
      unsubs.push(() => document.removeEventListener('firebase-ready', onReady))
    }
    return () => {
      unsubs.forEach(u => { try { u && u() } catch (e) { } })
    }
  }, [])

  const [rankings, setRankings] = useState([])
  const [rankingsVisible, setRankingsVisible] = useState(false)
  const [activeTabOverride, setActiveTabOverride] = useState(null)

  useEffect(() => {
    if (window.firestore) {
      const unsub = watchRankings(window.firestore, setRankings)
      return () => unsub && unsub()
    }
    setRankings([])
  }, [])

  async function handleApprove(item) {
    setVerifications(v => v.filter(x => x.id !== item.id))
    if (window.firestore) {
      await approveVerification(window.firestore, item.id, 'dashboard-user')
      await sendNotification(window.firestore, { type: 'verification_approved', verificationId: item.id })
    } else {
      alert(item.id + ' onaylandı (local)')
    }
  }
  async function handleReject(item) {
    setVerifications(v => v.filter(x => x.id !== item.id))
    if (window.firestore) {
      await rejectVerification(window.firestore, item.id, 'dashboard-user', 'manual_reject')
      await sendNotification(window.firestore, { type: 'verification_rejected', verificationId: item.id })
    } else {
      alert(item.id + ' reddedildi (local)')
    }
  }

  // Mobile View
  if (viewMode === 'mobile') {
    return (
      <>
        {activeTab === 'mobile-home' && (
          <MobileHome onNavigate={(page) => {
            if (page === 'home') setActiveTab('mobile-home')
            else if (page === 'groups') setActiveTab('mobile-groups')
            else if (page === 'emergency') setActiveTab('mobile-emergency')
            else if (page === 'rankings') setActiveTab('mobile-rankings')
            else if (page === 'settings') setActiveTab('mobile-settings')
            else if (page === 'analysis') setActiveTab('mobile-analysis')
            else if (page === 'map-detail') setActiveTab('mobile-map-detail')
          }} />
        )}
        {activeTab === 'mobile-settings' && (
          <MobileSettings
            onBack={() => setActiveTab('mobile-home')}
            onLogout={() => { setUser(null); setActiveTab('mobile-home'); alert('Çıkış yapıldı') }}
          />
        )}
        {activeTab === 'mobile-groups' && (
          <MobileGroups onBack={() => setActiveTab('mobile-home')} />
        )}
        {activeTab === 'mobile-emergency' && (
          <MobileEmergency onBack={() => setActiveTab('mobile-home')} />
        )}
        {activeTab === 'mobile-rankings' && (
          <MobileRankings onBack={() => setActiveTab('mobile-home')} />
        )}
        {activeTab === 'mobile-scores' && (
          <div style={{ padding: 20 }}>
            <button onClick={() => setActiveTab('mobile-home')} style={{ marginBottom: 12 }}>← Geri</button>
            <MobileScores onBack={() => setActiveTab('mobile-home')} />
          </div>
        )}
        {activeTab === 'mobile-analysis' && (
          <div style={{ padding: 20 }}>
            <button onClick={() => setActiveTab('mobile-home')} style={{ marginBottom: 12 }}>← Geri</button>
            <div style={{ maxWidth: 820 }}>
              <h3>Görüntü Analizi</h3>
              <ImageAnalysis onStartCleanup={() => setActiveTab('mobile-active-cleanup')} />
            </div>
          </div>
        )}
        {activeTab === 'mobile-active-cleanup' && (
          <div style={{ padding: 20 }}>
            <button onClick={() => setActiveTab('mobile-home')} style={{ marginBottom: 12 }}>← Geri</button>
            <ActiveCleanup onEnd={() => setActiveTab('mobile-home')} />
          </div>
        )}
        {activeTab === 'home' && (
          <div style={{ padding: 20, paddingBottom: 100 }}>
            <button onClick={() => setActiveTab('mobile-home')} style={{ marginBottom: 12 }}>← Geri</button>
            <VolunteerGroups />
          </div>
        )}
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 100 }}>
          <button onClick={() => setViewMode('dashboard')} style={{ padding: 8, background: '#fff', border: '1px solid #ddd', borderRadius: 6, fontSize: 11 }}>
            Dashboard Görünümü
          </button>
        </div>
      </>
    )
  }

  // Dashboard View
  return (
    <div className="app">
      <Sidebar active={activeTab} onChange={setActiveTab} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(s => !s)} />
      <div className="main">
        <Header user={{ name: 'Test Belediye', municipality: 'Ankara' }} />
        <div className="content">
          {activeTab === 'dashboard' && <ModernDashboard reports={reports} operations={operations} />}
          {activeTab === 'scores' && <WebScores onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'rankings' && <WebRankings onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'settings' && <WebSettings onBack={() => setActiveTab('dashboard')} onLogout={() => { setUser(null); setActiveTab('dashboard'); alert('Çıkış yapıldı') }} />}
          {!user && (
            <div className="card" style={{ maxWidth: 600, margin: '40px auto' }}>
              <h3>Giriş / Test Modu</h3>
              <p style={{ color: '#666', marginBottom: 12 }}>Firebase olmadan test etmek için "Test Girişi" kullanın</p>
              <button
                onClick={() => setUser({ uid: 'test-user', email: 'test@test.com', displayName: 'Test Kullanıcı' })}
                style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, marginBottom: 12 }}
              >
                Test Girişi (Firebase'siz)
              </button>
              <AuthPanel onLoggedIn={u => setUser(u)} />
            </div>
          )}
          {activeTab === 'reports' && <ReportsPanel reports={reports} groups={groups} />}
          {activeTab === 'verification' && <VerificationPanel items={verifications} onApprove={handleApprove} onReject={handleReject} />}
          {activeTab === 'operations' && <OperationsPanel operations={operations} />}
          {activeTab === 'stats' && <StatsPanel reports={reports} operations={operations} />}
          {activeTab === 'admin' && <AdminUsersPanel />}
          {activeTab === 'home' && <VolunteerGroups />}
        </div>
      </div>
      <FooterControls
        onCreateGroup={() => setActiveTab('home')}
        onHome={() => setActiveTab('reports')}
        onEmergency={(t) => { if (t === '112') window.open('tel:112'); else if (t === 'itfaiye') window.open('tel:110'); else window.open('tel:0312xxxxxxx') }}
        rankingsVisible={rankingsVisible}
        onToggleRankings={() => setRankingsVisible(v => !v)}
        onScores={() => setActiveTab('mobile-scores')}
      />
      {rankingsVisible && (
        <div style={{ position: 'fixed', right: 12, bottom: 72, width: 320, maxHeight: 360, overflow: 'auto' }} className="card">
          <h4>Puan Sıralaması</h4>
          {rankings.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <div>{r.name}</div>
              <div style={{ fontWeight: 700 }}>{r.points || 0}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ position: 'fixed', top: 80, right: 12 }}>
        <button onClick={() => setViewMode('mobile')} style={{ padding: 8, background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11 }}>
          Mobil Görünüm
        </button>
      </div>
    </div>
  )
}




