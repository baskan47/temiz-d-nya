import React, { useState } from 'react'
import theme from './theme'
import { createGroup, joinGroup } from './groupService'

/**
 * 👥 Profesyonel Grup Yönetimi
 */
const GroupManagement = () => {
  const [groups, setGroups] = useState([
    {
      id: 1,
      name: 'Alsancak Temiz Gönüllüler',
      members: 12,
      leader: 'Ali Kaya',
      description: 'Alsancak bölgesinin temizliğini üstlenen aktif bir grup',
      createdDate: '15 Mart 2026',
      totalCleaned: 2450,
      avgScore: 4.8,
      status: 'active',
      color: '#1B6E4F',
      badge: '⭐',
    },
    {
      id: 2,
      name: 'Konak Çevre Koruma',
      members: 8,
      leader: 'Zeynep Yıldız',
      description: 'Konak ilçesinde çevre temizliği ve ağaçlandırma projesi',
      createdDate: '22 Şubat 2026',
      totalCleaned: 1850,
      avgScore: 4.6,
      status: 'active',
      color: '#4ECDC4',
      badge: '🌿',
    },
    {
      id: 3,
      name: 'Deniz Temizlik Ekibi',
      members: 15,
      leader: 'Mehmet Çapar',
      description: 'Kıyı bölgelerinin temizliğine ve deniz kirliliğinin azaltılmasına özel',
      createdDate: '10 Ocak 2026',
      totalCleaned: 3200,
      avgScore: 4.9,
      status: 'active',
      color: '#FF6B6B',
      badge: '🌊',
    },
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)

  // Called by CreateGroupModal after a successful creation
  function handleGroupCreated(newGroup) {
    setGroups(prev => [...prev, newGroup])
    setShowCreateModal(false)
  }

  // Called by GroupDetailModal when user joins a group
  function handleGroupJoined(group) {
    setGroups(prev =>
      prev.map(g =>
        g.id === group.id ? { ...g, members: g.members + 1 } : g
      )
    )
    setSelectedGroup(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <h2 style={{ color: theme.colors.dark, margin: 0, fontSize: 20, fontWeight: 700 }}>
          👥 Gönüllü Grupları
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: theme.gradients.primary,
            color: 'white',
            border: 'none',
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderRadius: theme.radius.md,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ➕ Grup Oluştur
        </button>
      </div>

      <div style={{ display: 'grid', gap: theme.spacing.lg }}>
        {groups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            onClick={() => setSelectedGroup(group)}
          />
        ))}
      </div>

      {selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onJoin={handleGroupJoined}
        />
      )}

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  )
}

const GroupCard = ({ group, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'white',
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      boxShadow: theme.shadows.md,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      borderTop: `4px solid ${group.color}`,
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
    {/* Başlık */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    }}>
      <div style={{
        width: 50,
        height: 50,
        borderRadius: '50%',
        background: group.color + '20',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
      }}>
        {group.badge}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0, color: theme.colors.dark, fontSize: 16, fontWeight: 700 }}>
          {group.name}
        </h3>
        <p style={{ margin: '4px 0 0 0', color: theme.colors.textSecondary, fontSize: 12 }}>
          👤 {group.leader}
        </p>
      </div>
      <div style={{
        background: '#51CF66' + '20',
        color: '#51CF66',
        padding: `4px 12px`,
        borderRadius: theme.radius.sm,
        fontSize: 11,
        fontWeight: 700,
      }}>
        🟢 Aktif
      </div>
    </div>

    {/* Açıklama */}
    <p style={{
      margin: `0 0 ${theme.spacing.md} 0`,
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 1.4,
    }}>
      {group.description}
    </p>

    {/* İstatistikler */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing.sm,
      padding: `${theme.spacing.md} 0`,
      borderTop: `1px solid ${theme.colors.light}`,
      borderBottom: `1px solid ${theme.colors.light}`,
      marginBottom: theme.spacing.md,
    }}>
      <StatBox emoji="👥" label="Üyeler" value={group.members} />
      <StatBox emoji="🗑️" label="Temizlendi" value={`${group.totalCleaned}m²`} />
      <StatBox emoji="⭐" label="Rating" value={group.avgScore} />
      <StatBox emoji="📅" label="Kuruluş" value={group.createdDate.split(' ')[0]} />
    </div>

    {/* Aksiyon Butonları */}
    <div style={{ display: 'flex', gap: theme.spacing.sm }}>
      <button
        style={{
          flex: 1,
          padding: theme.spacing.md,
          background: group.color + '20',
          color: group.color,
          border: `1px solid ${group.color}40`,
          borderRadius: theme.radius.md,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onMouseOver={e => e.currentTarget.style.background = group.color + '30'}
        onMouseOut={e => e.currentTarget.style.background = group.color + '20'}
      >
        👤 Takip Et
      </button>
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
          transition: 'all 0.3s ease',
        }}
        onMouseOver={e => e.currentTarget.style.background = theme.colors.primary + '30'}
        onMouseOut={e => e.currentTarget.style.background = theme.colors.primary + '20'}
      >
        ✉️ İletişim
      </button>
    </div>
  </div>
)

const StatBox = ({ emoji, label, value }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 16, marginBottom: 2 }}>{emoji}</div>
    <div style={{ fontSize: 10, color: theme.colors.textSecondary }}>
      {label}
    </div>
    <div style={{ fontSize: 12, fontWeight: 700, color: theme.colors.primary, marginTop: 2 }}>
      {value}
    </div>
  </div>
)

const GroupDetailModal = ({ group, onClose, onJoin }) => {
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)

  async function handleJoin() {
    setJoining(true)
    try {
      const userId = (window.auth && window.auth.currentUser)
        ? window.auth.currentUser.uid
        : 'anonymous-' + Date.now()
      if (window.firestore) {
        await joinGroup(window.firestore, String(group.id), userId)
      }
      setJoined(true)
      if (onJoin) onJoin(group)
    } catch (e) {
      console.error('joinGroup error:', e)
      alert('Gruba katılırken hata oluştu')
    } finally {
      setJoining(false)
    }
  }

  return (
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
        <div style={{ marginBottom: theme.spacing.lg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: group.color + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
              }}>
                {group.badge}
              </div>
              <div>
                <h2 style={{ margin: 0, color: theme.colors.dark }}>
                  {group.name}
                </h2>
                <p style={{ margin: '4px 0 0 0', color: theme.colors.textSecondary }}>
                  👤 Lider: {group.leader}
                </p>
              </div>
            </div>
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

          <p style={{ color: theme.colors.textSecondary, lineHeight: 1.6, marginBottom: theme.spacing.lg }}>
            {group.description}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: theme.spacing.md,
            marginBottom: theme.spacing.lg,
          }}>
            <InfoBox emoji="👥" label="Toplam Üyeler" value={group.members} />
            <InfoBox emoji="📅" label="Kuruluş Tarihi" value={group.createdDate} />
            <InfoBox emoji="🗑️" label="Temizlenen Alan" value={`${group.totalCleaned}m²`} />
            <InfoBox emoji="⭐" label="Ortalama Puan" value={group.avgScore} />
          </div>

          {joined ? (
            <div style={{
              width: '100%',
              padding: theme.spacing.lg,
              background: '#d1fae5',
              color: '#065f46',
              border: 'none',
              borderRadius: theme.radius.md,
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: theme.spacing.md,
            }}>
              ✅ Gruba katıldınız!
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining}
              style={{
                width: '100%',
                padding: theme.spacing.lg,
                background: joining ? '#9ca3af' : theme.gradients.primary,
                color: 'white',
                border: 'none',
                borderRadius: theme.radius.md,
                fontWeight: 700,
                cursor: joining ? 'not-allowed' : 'pointer',
                marginBottom: theme.spacing.md,
              }}
            >
              {joining ? '⏳ Katılınıyor...' : '➕ Gruba Katıl'}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              background: theme.colors.light,
              border: 'none',
              borderRadius: theme.radius.md,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Kapat
          </button>
        </div>
      </div>
    </>
  )
}

const InfoBox = ({ emoji, label, value }) => (
  <div style={{
    background: theme.colors.light,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
  }}>
    <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
    <div style={{ fontSize: 11, color: theme.colors.textSecondary, marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.dark }}>
      {value}
    </div>
  </div>
)

const CreateGroupModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!name.trim()) {
      alert('Lütfen grup adı girin')
      return
    }
    setCreating(true)
    try {
      const groupData = {
        name: name.trim(),
        description: description.trim(),
        owner: (window.auth && window.auth.currentUser)
          ? window.auth.currentUser.uid
          : null,
        members: [],
      }

      let newId = Date.now()
      if (window.firestore) {
        const id = await createGroup(window.firestore, groupData)
        newId = id
      }

      const newGroup = {
        id: newId,
        name: groupData.name,
        members: 1,
        leader: 'Siz',
        description: groupData.description || 'Yeni oluşturulan grup',
        createdDate: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
        totalCleaned: 0,
        avgScore: 0,
        status: 'open',
        color: '#10b981',
        badge: '🌱',
      }

      if (onCreated) onCreated(newGroup)
      else onClose()
    } catch (e) {
      console.error('createGroup error:', e)
      alert('Grup oluşturulurken hata oluştu')
    } finally {
      setCreating(false)
    }
  }

  return (
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
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xl,
        maxWidth: 400,
        width: '90%',
        zIndex: 1000,
        boxShadow: theme.shadows.xl,
      }}>
        <h2 style={{ margin: '0 0 ' + theme.spacing.lg + ' 0', color: theme.colors.dark }}>
          ➕ Yeni Grup Oluştur
        </h2>

        <input
          type="text"
          placeholder="Grup Adı"
          value={name}
          onChange={e => setName(e.target.value)}
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
          placeholder="Grup Açıklaması"
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
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
            onClick={onClose}
            disabled={creating}
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
            onClick={handleCreate}
            disabled={creating}
            style={{
              flex: 1,
              padding: theme.spacing.md,
              background: creating ? '#9ca3af' : theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: theme.radius.md,
              cursor: creating ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {creating ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
        </div>
      </div>
    </>
  )
}

export default GroupManagement
