import React, { useState } from 'react'
import theme from './theme'
import { Card } from './components'

/**
 * WebSettings Component
 * Web version of mobile settings with modern design
 * Features: Profile card, settings toggles, language selection, logout
 */
const WebSettings = ({ onBack, onLogout }) => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'tr',
    emailUpdates: false,
  })

  const [showLanguageDialog, setShowLanguageDialog] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleSettingChange = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
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

      {/* Profile Card */}
      <Card
        style={{
          background: theme.gradients.primary,
          color: 'white',
          marginBottom: theme.spacing.xl,
          padding: theme.spacing.xl,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.lg }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              border: '3px solid rgba(255,255,255,0.3)',
            }}
          >
            👤
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, marginBottom: theme.spacing.xs }}>
              Zeynep Yıldız
            </h3>
            <div style={{ opacity: 0.9, marginBottom: theme.spacing.sm }}>zeynep.yildiz@example.com</div>
            <div style={{ opacity: 0.8, fontSize: 13 }}>
              ⭐ Sıra: #2 | 🏆 Başarı: 12
            </div>
          </div>
        </div>
      </Card>

      {/* Settings Groups */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h3 style={{ ...theme.typography.sizes.lg, fontWeight: 700, marginBottom: theme.spacing.lg, color: theme.colors.dark }}>
          ⚙️ Tercihler
        </h3>

        <Card style={{ marginBottom: theme.spacing.lg }}>
          <h4 style={{ margin: '0 0 ' + theme.spacing.lg + ' 0', color: theme.colors.dark }}>Bildirimler</h4>
          <SettingItem
            label="Anında Bildirimler"
            description="Yeni görevler ve mesajlar için bildirim al"
            checked={settings.notifications}
            onChange={() => handleSettingChange('notifications')}
          />
          <SettingItem
            label="E-Posta Güncellemeleri"
            description="Haftalık aktivite raporu gönder"
            checked={settings.emailUpdates}
            onChange={() => handleSettingChange('emailUpdates')}
            last
          />
        </Card>

        <Card style={{ marginBottom: theme.spacing.lg }}>
          <h4 style={{ margin: '0 0 ' + theme.spacing.lg + ' 0', color: theme.colors.dark }}>Görünüm</h4>
          <SettingItem
            label="Koyu Mod"
            description="Gözleri rahatlatmak için koyu tema kullan"
            checked={settings.darkMode}
            onChange={() => handleSettingChange('darkMode')}
            last
          />
        </Card>

        <Card style={{ marginBottom: theme.spacing.lg }}>
          <h4 style={{ margin: '0 0 ' + theme.spacing.lg + ' 0', color: theme.colors.dark }}>Dil & Bölge</h4>
          <button
            onClick={() => setShowLanguageDialog(true)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.spacing.md,
              background: theme.colors.light,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              cursor: 'pointer',
              fontWeight: 600,
              color: theme.colors.dark,
              transition: 'all 0.3s ease',
            }}
            onMouseOver={e => e.target.style.background = theme.colors.light}
          >
            <span>
              🌍 Dil: {settings.language === 'tr' ? 'Türkçe' : settings.language === 'en' ? 'English' : 'Français'}
            </span>
            <span>›</span>
          </button>
        </Card>
      </div>

      {/* About Section */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <h3 style={{ ...theme.typography.sizes.lg, fontWeight: 700, marginBottom: theme.spacing.lg, color: theme.colors.dark }}>
          ℹ️ Hakkında
        </h3>
        <div style={{ lineHeight: 1.8, color: theme.colors.textSecondary }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: theme.spacing.md, borderBottom: `1px solid ${theme.colors.light}` }}>
            <span>Uygulama Sürümü</span>
            <strong style={{ color: theme.colors.dark }}>2.0.0</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: theme.spacing.md }}>
            <span>Ziyaret Etmek</span>
            <a href="#" style={{ color: theme.colors.primary, textDecoration: 'none', fontWeight: 600 }}>
              purdunya.org
            </a>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card
        style={{
          background: theme.colors.error + '10',
          border: `1px solid ${theme.colors.error}30`,
        }}
      >
        <h3 style={{ ...theme.typography.sizes.lg, fontWeight: 700, marginBottom: theme.spacing.lg, color: theme.colors.error }}>
          ⚠️ Tehlikeli İşlemler
        </h3>
        <button
          onClick={() => setShowLogoutDialog(true)}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            background: theme.colors.error,
            color: 'white',
            border: 'none',
            borderRadius: theme.radius.md,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={e => e.target.style.opacity = '0.9'}
          onMouseOut={e => e.target.style.opacity = '1'}
        >
          🚪 Çıkış Yap
        </button>
      </Card>

      {/* Language Dialog */}
      {showLanguageDialog && (
        <Dialog
          title="Dil Seçin"
          onClose={() => setShowLanguageDialog(false)}
        >
          {[
            { code: 'tr', name: 'Türkçe' },
            { code: 'en', name: 'English' },
            { code: 'fr', name: 'Français' },
          ].map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                setSettings(prev => ({ ...prev, language: lang.code }))
                setShowLanguageDialog(false)
              }}
              style={{
                width: '100%',
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                background: settings.language === lang.code ? theme.colors.primary : 'white',
                color: settings.language === lang.code ? 'white' : theme.colors.dark,
                border: `1px solid ${settings.language === lang.code ? theme.colors.primary : theme.colors.light}`,
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.3s ease',
              }}
            >
              {lang.name}
            </button>
          ))}
        </Dialog>
      )}

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <Dialog
          title="Çıkış Yap"
          onClose={() => setShowLogoutDialog(false)}
        >
          <p style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.lg }}>
            Gerçekten çıkış yapmak istediğinize emin misiniz?
          </p>
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <button
              onClick={() => setShowLogoutDialog(false)}
              style={{
                flex: 1,
                padding: theme.spacing.md,
                background: theme.colors.light,
                color: theme.colors.dark,
                border: 'none',
                borderRadius: theme.radius.md,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              İptal
            </button>
            <button
              onClick={() => {
                setShowLogoutDialog(false)
                onLogout && onLogout()
              }}
              style={{
                flex: 1,
                padding: theme.spacing.md,
                background: theme.colors.error,
                color: 'white',
                border: 'none',
                borderRadius: theme.radius.md,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Çıkış Yap
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

/**
 * SettingItem Component
 * Reusable toggle setting with label and description
 */
const SettingItem = ({ label, description, checked, onChange, last }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: last ? 0 : theme.spacing.md,
        borderBottom: last ? 'none' : `1px solid ${theme.colors.light}`,
        marginBottom: last ? 0 : theme.spacing.md,
      }}
    >
      <div>
        <div style={{ fontWeight: 600, color: theme.colors.dark, marginBottom: theme.spacing.xs }}>{label}</div>
        <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>{description}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

/**
 * Toggle Component
 * Modern toggle switch
 */
const Toggle = ({ checked, onChange }) => {
  return (
    <button
      onClick={onChange}
      style={{
        width: 50,
        height: 28,
        borderRadius: '14px',
        border: 'none',
        background: checked ? theme.colors.primary : theme.colors.light,
        cursor: 'pointer',
        padding: 0,
        position: 'relative',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'white',
          top: 2,
          left: checked ? 24 : 2,
          transition: 'all 0.3s ease',
          boxShadow: theme.shadows.sm,
        }}
      />
    </button>
  )
}

/**
 * Dialog Component
 * Reusable modal dialog
 */
const Dialog = ({ title, onClose, children }) => {
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
          animation: 'fadeIn 0.3s ease',
        }}
        onClick={onClose}
      />
      <div
        style={{
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
          animation: 'slideUp 0.3s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 ' + theme.spacing.lg + ' 0', color: theme.colors.dark }}>
          {title}
        </h3>
        {children}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  )
}

export default WebSettings
