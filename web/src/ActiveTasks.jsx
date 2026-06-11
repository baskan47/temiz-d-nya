import React, { useState } from 'react'
import theme from './theme'

/**
 * 🎯 Aktif Görevler Sistemi
 * Profesyonel Görev Yönetimi
 */
const ActiveTasks = () => {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      name: 'Meles Deresi Temizliği',
      location: 'Alsancak, İzmir',
      volunteers: [
        { id: 1, name: 'Ali Kaya', emoji: '👨' },
        { id: 2, name: 'Zeynep Yıldız', emoji: '👩' },
        { id: 3, name: 'Mehmet Çapar', emoji: '👨' },
        { id: 4, name: 'Ayşe Demir', emoji: '👩' },
        { id: 5, name: 'Fatih Esen', emoji: '👨' },
      ],
      progress: 65,
      areaSize: 250,
      wasteWeight: 45,
      status: 'active',
      startTime: '14:30',
      estimatedEnd: '17:00',
      difficulty: 'Orta',
      reward: 250,
    },
    {
      id: 2,
      name: 'Mithatpaşa Parkı Bakımı',
      location: 'Konak, İzmir',
      volunteers: [
        { id: 1, name: 'Hasan Yüz', emoji: '👨' },
        { id: 2, name: 'Nur Kılıç', emoji: '👩' },
        { id: 3, name: 'Can Arslan', emoji: '👨' },
      ],
      progress: 40,
      areaSize: 180,
      wasteWeight: 25,
      status: 'active',
      startTime: '15:00',
      estimatedEnd: '18:00',
      difficulty: 'Kolay',
      reward: 150,
    },
    {
      id: 3,
      name: 'Alsancak Sokakları Temizliği',
      location: 'Alsancak, İzmir',
      volunteers: [
        { id: 1, name: 'Gül Şahin', emoji: '👩' },
        { id: 2, name: 'Kerem Usta', emoji: '👨' },
      ],
      progress: 85,
      areaSize: 320,
      wasteWeight: 62,
      status: 'finishing',
      startTime: '13:00',
      estimatedEnd: '16:30',
      difficulty: 'Zor',
      reward: 350,
    },
  ])

  const [selectedTask, setSelectedTask] = useState(null)
  const [joinModal, setJoinModal] = useState(false)

  return (
    <div>
      <h2 style={{ color: theme.colors.dark, marginBottom: theme.spacing.lg, fontSize: 20, fontWeight: 700 }}>
        🎯 Canlı Görevler
      </h2>

      <div style={{ display: 'grid', gap: theme.spacing.lg }}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => setSelectedTask(task)}
            onJoin={() => {
              setSelectedTask(task)
              setJoinModal(true)
            }}
          />
        ))}
      </div>

      {/* Görev Detay Modal */}
      {selectedTask && !joinModal && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onJoin={() => setJoinModal(true)}
        />
      )}

      {/* Göreve Katıl Modal */}
      {joinModal && selectedTask && (
        <JoinTaskModal
          task={selectedTask}
          onClose={() => {
            setJoinModal(false)
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}

const TaskCard = ({ task, onClick, onJoin }) => (
  <div
    onClick={onClick}
    style={{
      background: 'white',
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      boxShadow: theme.shadows.md,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      borderLeft: `4px solid ${
        task.status === 'finishing' ? theme.colors.warning : theme.colors.primary
      }`,
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: theme.spacing.md }}>
      <div>
        <h3 style={{ margin: 0, color: theme.colors.dark, fontSize: 16, fontWeight: 700 }}>
          {task.name}
        </h3>
        <p style={{ margin: '4px 0 0 0', color: theme.colors.textSecondary, fontSize: 13 }}>
          📍 {task.location}
        </p>
      </div>
      <div style={{
        background: task.status === 'finishing' ? theme.colors.warning + '20' : theme.colors.primary + '20',
        color: task.status === 'finishing' ? theme.colors.warning : theme.colors.primary,
        padding: `4px 12px`,
        borderRadius: theme.radius.sm,
        fontSize: 11,
        fontWeight: 700,
      }}>
        {task.status === 'finishing' ? '🏁 Bitiş Aşaması' : '🟢 Aktif'}
      </div>
    </div>

    {/* Progress Bar */}
    <div style={{ marginBottom: theme.spacing.md }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: theme.colors.dark, fontWeight: 600 }}>İlerleme</span>
        <span style={{ color: theme.colors.primary, fontWeight: 700 }}>{task.progress}%</span>
      </div>
      <div style={{
        width: '100%',
        height: 8,
        background: theme.colors.light,
        borderRadius: theme.radius.sm,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${task.progress}%`,
          height: '100%',
          background: theme.gradients.primary,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>

    {/* Stats */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      padding: `${theme.spacing.md} 0`,
      borderTop: `1px solid ${theme.colors.light}`,
      borderBottom: `1px solid ${theme.colors.light}`,
    }}>
      <StatItem emoji="👥" label="Gönüllü" value={task.volunteers.length} />
      <StatItem emoji="📐" label="Alan" value={`${task.areaSize}m²`} />
      <StatItem emoji="⚖️" label="Atık" value={`${task.wasteWeight}kg`} />
      <StatItem emoji="⭐" label="Ödül" value={task.reward} />
    </div>

    {/* Gönüllüler */}
    <div style={{ marginBottom: theme.spacing.md }}>
      <div style={{ fontSize: 12, color: theme.colors.dark, fontWeight: 600, marginBottom: 6 }}>
        👥 Katılımcılar
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {task.volunteers.map(v => (
          <div
            key={v.id}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: theme.colors.primary + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              cursor: 'pointer',
            }}
            title={v.name}
          >
            {v.emoji}
          </div>
        ))}
      </div>
    </div>

    {/* Katıl Butonu */}
    <button
      onClick={e => {
        e.stopPropagation()
        onJoin()
      }}
      style={{
        width: '100%',
        padding: theme.spacing.md,
        background: theme.gradients.primary,
        color: 'white',
        border: 'none',
        borderRadius: theme.radius.md,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      ✅ Göreve Katıl
    </button>
  </div>
)

const StatItem = ({ emoji, label, value }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 14, marginBottom: 2 }}>{emoji}</div>
    <div style={{ fontSize: 10, color: theme.colors.textSecondary, marginBottom: 2 }}>
      {label}
    </div>
    <div style={{ fontSize: 13, fontWeight: 700, color: theme.colors.primary }}>
      {value}
    </div>
  </div>
)

const TaskDetailModal = ({ task, onClose, onJoin }) => (
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
        <h2 style={{ margin: 0, color: theme.colors.dark }}>📝 Görev Detayları</h2>
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

      <div style={{ marginBottom: theme.spacing.lg }}>
        <h3 style={{ color: theme.colors.primary, marginBottom: theme.spacing.md }}>
          {task.name}
        </h3>
        
        <DetailRow emoji="⏰" label="Başlama" value={task.startTime} />
        <DetailRow emoji="🏁" label="Tahmini Bitiş" value={task.estimatedEnd} />
        <DetailRow emoji="⭐" label="Zorluk" value={task.difficulty} />
        <DetailRow emoji="💰" label="Ödül" value={`${task.reward} puan`} />
      </div>

      <button
        onClick={onJoin}
        style={{
          width: '100%',
          padding: theme.spacing.lg,
          background: theme.gradients.primary,
          color: 'white',
          border: 'none',
          borderRadius: theme.radius.md,
          fontWeight: 700,
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        ✅ Katıl ve Başla
      </button>
    </div>
  </>
)

const JoinTaskModal = ({ task, onClose }) => (
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
      zIndex: 1000,
      boxShadow: theme.shadows.xl,
    }}>
      <div style={{ textAlign: 'center', marginBottom: theme.spacing.lg }}>
        <div style={{ fontSize: 48, marginBottom: theme.spacing.md }}>✅</div>
        <h2 style={{ margin: 0, color: theme.colors.success, marginBottom: theme.spacing.sm }}>
          Göreve Katıldın!
        </h2>
        <p style={{ margin: 0, color: theme.colors.textSecondary }}>
          {task.name}
        </p>
      </div>

      <div style={{
        background: theme.colors.light,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.md,
        marginBottom: theme.spacing.lg,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>
          Kazanabileceğin Puan
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.primary }}>
          +{task.reward}
        </div>
      </div>

      <button
        onClick={onClose}
        style={{
          width: '100%',
          padding: theme.spacing.lg,
          background: theme.colors.primary,
          color: 'white',
          border: 'none',
          borderRadius: theme.radius.md,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        🎉 Harika! Başla
      </button>
    </div>
  </>
)

const DetailRow = ({ emoji, label, value }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    padding: `${theme.spacing.md} 0`,
    borderBottom: `1px solid ${theme.colors.light}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span style={{ color: theme.colors.textSecondary }}>{label}</span>
    </div>
    <span style={{ fontWeight: 700, color: theme.colors.dark }}>{value}</span>
  </div>
)

export default ActiveTasks
