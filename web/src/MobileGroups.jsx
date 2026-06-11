import React, { useState } from 'react'
import { createGroup } from './groupService'

export default function MobileGroups({ onBack }) {
  const [photo, setPhoto] = useState(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleCreate() {
    if (!name.trim()) {
      alert('Lütfen grup adı girin')
      return
    }
    setCreating(true)
    try {
      const groupData = {
        name: name.trim(),
        category,
        location,
        description,
        owner: (window.auth && window.auth.currentUser) ? window.auth.currentUser.uid : null,
        members: [],
      }

      if (window.firestore) {
        await createGroup(window.firestore, groupData)
      }
      // Local feedback regardless of Firestore
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        if (onBack) onBack()
      }, 1800)
    } catch (e) {
      console.error('Grup oluşturma hatası:', e)
      alert('Grup oluşturulurken bir hata oluştu')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mobile-app" style={{ background: '#fff' }}>
      {/* Header */}
      <div style={{ background: '#10b981', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Yeni Grup Oluştur</div>
        <div style={{ width: 24 }}></div>
      </div>

      {success && (
        <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px 24px', fontWeight: 700, textAlign: 'center' }}>
          ✅ Grup başarıyla oluşturuldu!
        </div>
      )}

      <div style={{ padding: 24 }}>

        {/* Photo Upload Circle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: '#f0fdf4',
            border: '2px dashed #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginBottom: 16,
            cursor: 'pointer'
          }} onClick={() => document.getElementById('group-photo-input').click()}>
            {photo ? (
              <img src={URL.createObjectURL(photo)} alt="preview" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 60, height: 40, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </div>
            )}
            <input id="group-photo-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setPhoto(e.target.files[0])} />
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px 0' }}>Grup Fotoğrafı Ekle</h3>
          <p style={{ fontSize: 14, color: '#10b981', margin: 0, fontWeight: 500 }}>Grubunuzu yansıtan bir görsel seçin</p>
        </div>

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Grup Adı</label>
            <input
              type="text"
              placeholder="Örn: Yeşil Adımlar Mahalle Girişimi"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 24,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Grup Kategorisi</label>
            <div style={{ position: 'relative' }}>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 24,
                  fontSize: 14,
                  outline: 'none',
                  appearance: 'none',
                  color: '#6b7280',
                  boxSizing: 'border-box'
                }}>
                <option value="">Kategori seçin...</option>
                <option value="cevre">Çevre Temizliği</option>
                <option value="geri-donusum">Geri Dönüşüm</option>
                <option value="egitim">Eğitim</option>
              </select>
              <div style={{ position: 'absolute', right: 16, top: 16, pointerEvents: 'none' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Konum / Şehir</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Şehir veya ilçe girin..."
                value={location}
                onChange={e => setLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 24,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ position: 'absolute', right: 16, top: 14, pointerEvents: 'none', color: '#10b981' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Grup Açıklaması</label>
            <textarea
              placeholder="Grubunuzun hedeflerinden ve etkinliklerinden kısaca bahsedin..."
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 24,
                fontSize: 14,
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

        </div>

        {/* Submit Button */}
        <button
          onClick={handleCreate}
          disabled={creating}
          style={{
            width: '100%',
            background: creating ? '#9ca3af' : '#10b981',
            color: '#fff',
            border: 'none',
            padding: '18px',
            borderRadius: 30,
            fontSize: 16,
            fontWeight: 800,
            marginTop: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: creating ? 'none' : '0 10px 20px -5px rgba(16, 185, 129, 0.4)',
            cursor: creating ? 'not-allowed' : 'pointer'
          }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
          {creating ? 'OLUŞTURULUYOR...' : 'GRUBU OLUŞTUR'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#9ca3af', maxWidth: 280, margin: '24px auto' }}>
          Grup oluşturarak topluluk kurallarımızı ve çevre politikalarımızı kabul etmiş sayılırsınız.
        </div>

      </div>
    </div>
  )
}
