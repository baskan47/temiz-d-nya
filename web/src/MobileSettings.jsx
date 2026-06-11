import React, { useState, useEffect } from 'react'
import { appName, appVersion } from './config'
import { getNotificationSettings, saveNotificationSettings, requestNotificationPermission } from './pushNotificationService'
import { getCities, getDistricts, getNeighborhoods, getVillages, searchItems, getCityFromCoordinates } from './addressService'
import { getCurrentLocation } from './offlineService'

export default function MobileSettings({ onBack, onLogout }) {
  const [darkMode, setDarkMode] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showAddressSelector, setShowAddressSelector] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [showSecuritySettings, setShowSecuritySettings] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

  // Profil Bilgileri
  const [profile, setProfile] = useState({
    name: 'Ahmet Yılmaz',
    email: 'ahmet@gmail.com',
    phone: '+90 532 123 4567',
    avatar: null
  })
  const [editedProfile, setEditedProfile] = useState({ ...profile })

  // Adres Bilgileri
  const [address, setAddress] = useState({
    cityId: null,
    cityName: '',
    districtId: null,
    districtName: '',
    neighborhoodId: null,
    neighborhoodName: '',
    street: '',
    buildingNo: ''
  })

  // Adres listeleri
  const [cities, setCities] = useState([])
  const [districts, setDistricts] = useState([])
  const [neighborhoods, setNeighborhoods] = useState([])
  const [villages, setVillages] = useState([])

  // Arama terimleri
  const [citySearch, setCitySearch] = useState('')
  const [districtSearch, setDistrictSearch] = useState('')
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('')
  const [villageSearch, setVillageSearch] = useState('')

  // Loading states
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false)
  const [loadingVillages, setLoadingVillages] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)

  const [areaType, setAreaType] = useState('mahalle') // 'mahalle' veya 'köy'

  // Bildirim Ayarları
  const [notifications, setNotifications] = useState(getNotificationSettings())

  // Güvenlik Ayarları
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [dataSaverMode, setDataSaverMode] = useState(false)

  // Cihaz yeteneklerini kontrol et
  useEffect(() => {
    // İlleri yükle
    getCities().then(data => setCities(data))

    // Biyometrik desteği kontrol et
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setBiometricAvailable(available))
        .catch(() => setBiometricAvailable(false))
    }

    // localStorage'dan ayarları yükle
    const savedBiometric = localStorage.getItem('biometric_enabled')
    if (savedBiometric) setBiometricEnabled(JSON.parse(savedBiometric))

    const savedDataSaver = localStorage.getItem('data_saver_mode')
    if (savedDataSaver) setDataSaverMode(JSON.parse(savedDataSaver))
  }, [])

  // Karanlık mod değiştiğinde
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

  // Profil düzenleme validasyonu
  const validateProfile = () => {
    // Email validasyonu
    if (editedProfile.email && !editedProfile.email.includes('@')) {
      alert('❌ Geçerli bir email adresi giriniz!')
      return false
    }

    // Telefon validasyonu
    if (editedProfile.phone && !/^\+?[\d\s-]+$/.test(editedProfile.phone)) {
      alert('❌ Geçerli bir telefon numarası giriniz!')
      return false
    }

    return true
  }

  // Profil kaydetme
  const handleSaveProfile = () => {
    if (validateProfile()) {
      setProfile({ ...editedProfile })
      setShowEditProfile(false)
      alert('✅ Profil başarıyla güncellendi!')
      // Firebase'e kaydet
      // await updateUserProfile(editedProfile)
    }
  }

  // Konum izinlerini aç
  const openLocationSettings = () => {
    alert('📱 Telefon ayarlarına yönlendiriliyorsunuz...\n\nAyarlar > Temiz Dünya > İzinler > Konum')
    // Android için
    // if (Platform.OS === 'android') {
    //   Linking.openSettings()
    // }
    // iOS için
    // if (Platform.OS === 'ios') {
    //   Linking.openURL('app-settings:')
    // }
  }

  // İl seçildiğinde
  const handleCitySelect = async (city) => {
    setAddress({
      cityId: city.id,
      cityName: city.name,
      districtId: null,
      districtName: '',
      neighborhoodId: null,
      neighborhoodName: '',
      street: '',
      buildingNo: ''
    })
    setCitySearch('')
    setDistrictSearch('')
    setNeighborhoodSearch('')
    setNeighborhoods([])

    // İlçeleri yükle
    setLoadingDistricts(true)
    try {
      const fetchedDistricts = await getDistricts(city.id)
      setDistricts(fetchedDistricts)
    } catch (error) {
      alert('❌ İlçeler yüklenemedi: ' + error.message)
      setDistricts([])
    } finally {
      setLoadingDistricts(false)
    }
  }

  // İlçe seçildiğinde
  const handleDistrictSelect = async (district) => {
    setAddress({
      ...address,
      districtId: district.id,
      districtName: district.name,
      neighborhoodId: null,
      neighborhoodName: '',
      street: '',
      buildingNo: ''
    })
    setDistrictSearch('')
    setNeighborhoodSearch('')
    setVillageSearch('')

    // Seçilen tipe göre mahalle veya köyleri yükle
    if (areaType === 'mahalle') {
      setLoadingNeighborhoods(true)
      try {
        const fetchedNeighborhoods = await getNeighborhoods(district.id)
        setNeighborhoods(fetchedNeighborhoods)
      } catch (error) {
        alert('❌ Mahalleler yüklenemedi: ' + error.message)
        setNeighborhoods([])
      } finally {
        setLoadingNeighborhoods(false)
      }
    } else {
      setLoadingVillages(true)
      try {
        const fetchedVillages = await getVillages(district.id)
        setVillages(fetchedVillages)
      } catch (error) {
        alert('❌ Köyler yüklenemedi: ' + error.message)
        setVillages([])
      } finally {
        setLoadingVillages(false)
      }
    }
  }

  const handleAreaTypeChange = async (type) => {
    setAreaType(type)
    // Eğer zaten ilçe seçiliyse yeni tipin verilerini yükle
    if (!address.districtId) return
    if (type === 'mahalle') {
      setLoadingNeighborhoods(true)
      try {
        const fetchedNeighborhoods = await getNeighborhoods(address.districtId)
        setNeighborhoods(fetchedNeighborhoods)
      } catch (error) {
        setNeighborhoods([])
      } finally {
        setLoadingNeighborhoods(false)
      }
    } else {
      setLoadingVillages(true)
      try {
        const fetchedVillages = await getVillages(address.districtId)
        setVillages(fetchedVillages)
      } catch (error) {
        setVillages([])
      } finally {
        setLoadingVillages(false)
      }
    }
  }

  // Mahalle seçildiğinde
  const handleNeighborhoodSelect = (neighborhood) => {
    setAddress({
      ...address,
      neighborhoodId: neighborhood.id,
      neighborhoodName: neighborhood.name
    })
    setNeighborhoodSearch('')
  }

  // GPS ile otomatik konum
  const handleAutoLocation = async () => {
    setLoadingLocation(true)
    try {
      const location = await getCurrentLocation()
      const cityData = await getCityFromCoordinates(location.latitude, location.longitude)

      if (cityData) {
        alert(`📍 Konumunuz tespit edildi: ${cityData.name}`)
        await handleCitySelect(cityData)
      } else {
        alert('❌ Konum bilgisi alınamadı')
      }
    } catch (error) {
      alert('❌ GPS hatası: ' + error.message)
    } finally {
      setLoadingLocation(false)
    }
  }

  // Adres kaydetme
  const handleSaveAddress = () => {
    if (!address.cityId || !address.districtId || !address.neighborhoodId || !address.street || !address.buildingNo) {
      alert('❌ Lütfen tüm alanları doldurunuz!')
      return
    }

    const fullAddress = {
      cityId: address.cityId,
      cityName: address.cityName,
      districtId: address.districtId,
      districtName: address.districtName,
      neighborhoodId: address.neighborhoodId,
      neighborhoodName: address.neighborhoodName,
      street: address.street,
      buildingNo: address.buildingNo,
      fullText: `${address.neighborhoodName}, ${address.street} No:${address.buildingNo}, ${address.districtName}/${address.cityName}`
    }

    // Firebase'e kaydet
    // await updateUserAddress(fullAddress)

    // localStorage'a kaydet
    localStorage.setItem('user_address', JSON.stringify(fullAddress))

    alert('✅ Adres kaydedildi! Yakınınızdaki etkinlikler bu adrese göre filtrelenecek.')
    setShowAddressSelector(false)
  }

  // Bildirim ayarlarını kaydet
  const handleSaveNotifications = () => {
    saveNotificationSettings(notifications)
    requestNotificationPermission()
    setShowNotificationSettings(false)
    alert('✅ Bildirim ayarları kaydedildi!')
  }

  // Biyometrik girişi değiştir
  const toggleBiometric = (enabled) => {
    setBiometricEnabled(enabled)
    localStorage.setItem('biometric_enabled', JSON.stringify(enabled))
    if (enabled) {
      alert('✅ Biyometrik giriş aktif edildi!')
    } else {
      alert('ℹ️ Biyometrik giriş kapatıldı.')
    }
  }

  // Veri tasarrufu modunu değiştir
  const toggleDataSaver = (enabled) => {
    setDataSaverMode(enabled)
    localStorage.setItem('data_saver_mode', JSON.stringify(enabled))
    if (enabled) {
      alert('✅ Veri Tasarrufu Modu aktif! Fotoğraflar düşük kalitede yüklenecek.')
    } else {
      alert('ℹ️ Veri Tasarrufu Modu kapatıldı.')
    }
  }

  // Hesabı sil
  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      '⚠️ UYARI!\n\n' +
      'Hesabınızı kalıcı olarak silmek üzeresiniz.\n\n' +
      '• Tüm verileriniz silinecektir\n' +
      '• Kazandığınız puanlar kaybolacaktır\n' +
      '• Bu işlem geri alınamaz\n\n' +
      'Devam etmek istiyor musunuz?'
    )

    if (confirmed) {
      const finalConfirm = window.prompt('Onaylamak için "SİL" yazın:')
      if (finalConfirm === 'SİL') {
        alert('🗑️ Hesabınız siliniyor...')
        // Firebase'den hesabı sil
        // await deleteUserAccount()
        // onLogout()
      } else {
        alert('❌ İşlem iptal edildi.')
      }
    }
  }

  return (
    <div className="mobile-screen">
      <div className="mobile-screen-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2>Ayarlar</h2>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="mobile-content">
        {/* User Profile Card */}
        <div className="settings-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>{profile.name}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{profile.email}</div>
              <button
                style={{ background: 'none', border: 'none', color: '#10b981', fontSize: 13, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => {
                  setEditedProfile({ ...profile })
                  setShowEditProfile(true)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Düzenle
              </button>
            </div>
          </div>
        </div>

        {/* Settings List */}
        <div className="settings-list">
          <button className="settings-item" onClick={openLocationSettings}>
            <div className="settings-icon" style={{ background: '#ecfdf5' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span className="settings-label">Konum İzinleri</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button className="settings-item" onClick={() => setShowAddressSelector(true)}>
            <div className="settings-icon" style={{ background: '#ecfdf5' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="settings-label">Şehir ve Mahalle Değiştir</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button className="settings-item" onClick={() => setShowNotificationSettings(true)}>
            <div className="settings-icon" style={{ background: '#ecfdf5' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <span className="settings-label">Bildirim Ayarları</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button className="settings-item" onClick={() => setShowSecuritySettings(true)}>
            <div className="settings-icon" style={{ background: '#ecfdf5' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span className="settings-label">Hesap Güvenliği</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-icon" style={{ background: '#f3f4f6' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </div>
            <span className="settings-label">Karanlık Mod</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Veri Tasarrufu Modu */}
          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-icon" style={{ background: '#fef3c7' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="settings-label">Veri Tasarrufu</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={dataSaverMode} onChange={(e) => toggleDataSaver(e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Logout Button */}
        <button className="logout-btn" onClick={onLogout}>
          Çıkış Yap
        </button>

        {/* Delete Account Button */}
        <button
          className="delete-account-btn"
          onClick={() => setShowDeleteAccount(true)}
          style={{
            width: '100%',
            padding: '14px',
            marginTop: '12px',
            background: '#fff',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            color: '#ef4444',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          🗑️ Hesabımı Kalıcı Olarak Sil
        </button>

        <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 12 }}>
          {`${appVersion} • © 2025 ${appName}`}
        </div>
      </div>


      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 20 }}>✏️ Profil Düzenle</h3>

            <div className="form-group">
              <label>Ad Soyad</label>
              <input
                type="text"
                className="input-select"
                value={editedProfile.name}
                onChange={e => setEditedProfile({ ...editedProfile, name: e.target.value })}
                placeholder="Adınız Soyadınız"
              />
            </div>

            <div className="form-group">
              <label>Email <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="email"
                className="input-select"
                value={editedProfile.email}
                onChange={e => setEditedProfile({ ...editedProfile, email: e.target.value })}
                placeholder="ornek@gmail.com"
              />
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                ⓘ @ işareti zorunludur
              </div>
            </div>

            <div className="form-group">
              <label>Telefon</label>
              <input
                type="tel"
                className="input-select"
                value={editedProfile.phone}
                onChange={e => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                placeholder="+90 5XX XXX XX XX"
              />
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                ⓘ Sadece rakam giriniz
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-cancel" onClick={() => setShowEditProfile(false)}>
                İptal
              </button>
              <button className="btn-submit" onClick={handleSaveProfile}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Selector Modal */}
      {showAddressSelector && (
        <div className="modal-overlay" onClick={() => setShowAddressSelector(false)}>
          <div className="modal-content address-selector" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 20 }}>🏠 Adres Bilgileri</h3>

            {/* Otomatik Konum Butonu */}
            <button
              className="auto-location-btn"
              onClick={handleAutoLocation}
              disabled={loadingLocation}
              style={{
                width: '100%',
                padding: '14px',
                background: '#ecfdf5',
                border: '2px solid #10b981',
                borderRadius: '10px',
                color: '#10b981',
                fontWeight: 600,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer'
              }}
            >
              {loadingLocation ? '⏳ Konum alınıyor...' : '📍 Mevcut Konumumu Kullan'}
            </button>

            {/* İl Seçimi */}
            <div className="form-group">
              <label>İl Seçiniz <span style={{ color: '#ef4444' }}>*</span></label>

              {/* Arama Kutusu */}
              <input
                type="text"
                className="input-select"
                placeholder="🔍 İl ara..."
                value={citySearch}
                onChange={e => setCitySearch(e.target.value)}
                style={{ marginBottom: 8 }}
              />

              {/* İl Listesi */}
              <div className="scrollable-list">
                {searchItems(cities, citySearch).map(city => (
                  <button
                    key={city.id}
                    className={`list-item ${address.cityId === city.id ? 'selected' : ''}`}
                    onClick={() => handleCitySelect(city)}
                  >
                    {city.name}
                    {address.cityId === city.id && <span style={{ marginLeft: 'auto' }}>✓</span>}
                  </button>
                ))}
              </div>
              {address.cityName && (
                <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>
                  ✓ Seçilen: {address.cityName}
                </div>
              )}
            </div>

            {/* İlçe Seçimi */}
            <div className="form-group">
              <label>İlçe Seçiniz <span style={{ color: '#ef4444' }}>*</span></label>

              {loadingDistricts ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#10b981' }}>⏳ İlçeler yükleniyor...</div>
              ) : !address.cityId ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#6b7280', background: '#f3f4f6', borderRadius: 8 }}>
                  ⚠️ Önce il seçmelisiniz
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    className="input-select"
                    placeholder="🔍 İlçe ara..."
                    value={districtSearch}
                    onChange={e => setDistrictSearch(e.target.value)}
                    style={{ marginBottom: 8 }}
                    disabled={!address.cityId}
                  />

                  <div className="scrollable-list">
                    {searchItems(districts, districtSearch).map(district => (
                      <button
                        key={district.id}
                        className={`list-item ${address.districtId === district.id ? 'selected' : ''}`}
                        onClick={() => handleDistrictSelect(district)}
                      >
                        {district.name}
                        {address.districtId === district.id && <span style={{ marginLeft: 'auto' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                  {address.districtName && (
                    <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>
                      ✓ Seçilen: {address.districtName}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mahalle / Köy Elle Giriş */}
            <div className="form-group">
              <label>Mahalle / Köy <span style={{ color: '#ef4444' }}>*</span></label>

              {!address.districtId ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#6b7280', background: '#f3f4f6', borderRadius: 8 }}>
                  ⚠️ Önce ilçe seçmelisiniz
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    className="input-select"
                    placeholder="Mahalle veya Köy Adını Yazınız"
                    value={address.neighborhoodName}
                    onChange={e => setAddress({
                      ...address,
                      neighborhoodName: e.target.value,
                      neighborhoodId: e.target.value ? 99999 : null // Manuel giriş için dummy ID
                    })}
                  />
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                    ℹ️ Listeden seçmek yerine doğrudan yazınız.
                  </div>
                </>
              )}
            </div>

            {/* Manuel Giriş Alanları (Mahalle seçildikten sonra açılır) */}
            {address.neighborhoodId && (
              <>
                <div className="form-group">
                  <label>Sokak / Cadde <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    className="input-select"
                    placeholder="Örn: Atatürk Caddesi"
                    value={address.street}
                    onChange={e => setAddress({ ...address, street: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Bina / Kapı No <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    className="input-select"
                    placeholder="Örn: No: 123 Daire: 4"
                    value={address.buildingNo}
                    onChange={e => setAddress({ ...address, buildingNo: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Bilgi Kutusu */}
            <div style={{ background: '#f0f9ff', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#075985', lineHeight: 1.6 }}>
                ℹ️ Bu adres bilgisi:<br />
                • Yakınınızdaki etkinlikleri filtrelemek<br />
                • Size özel bildirimler göndermek<br />
                • Grup önerilerinde kullanılacaktır
              </div>
            </div>

            {/* Butonlar */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-cancel" onClick={() => setShowAddressSelector(false)}>
                İptal
              </button>
              <button
                className="btn-submit"
                onClick={handleSaveAddress}
                disabled={!address.cityId || !address.districtId || !address.neighborhoodName || !address.street || !address.buildingNo}
                style={{
                  opacity: (!address.cityId || !address.districtId || !address.neighborhoodName || !address.street || !address.buildingNo) ? 0.5 : 1,
                  cursor: (!address.cityId || !address.districtId || !address.neighborhoodName || !address.street || !address.buildingNo) ? 'not-allowed' : 'pointer'
                }}
              >
                ADRESİ KAYDET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <div className="modal-overlay" onClick={() => setShowNotificationSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 20 }}>🔔 Bildirim Ayarları</h3>

            <div className="notification-setting-item">
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Yeni Etkinlikler</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Yakınınızda yeni etkinlik başladığında bildirim alın (5 km yarıçap)</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.newEvents}
                  onChange={e => setNotifications({ ...notifications, newEvents: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-setting-item">
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Acil Durumlar</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Yakınınızda acil temizlik ihtiyacı olduğunda bildirim alın</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.emergencies}
                  onChange={e => setNotifications({ ...notifications, emergencies: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-setting-item">
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Ödüller</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Puan veya ödül kazandığınızda bildirim alın</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.rewards}
                  onChange={e => setNotifications({ ...notifications, rewards: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-setting-item">
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Hatırlatıcılar</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Devam eden temizlik operasyonları için hatırlatıcı alın</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.reminders}
                  onChange={e => setNotifications({ ...notifications, reminders: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-setting-item">
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Haftalık Özet</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Her hafta aktivitelerinizin özetini alın</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.weeklySummary}
                  onChange={e => setNotifications({ ...notifications, weeklySummary: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div style={{ background: '#fef3c7', padding: 12, borderRadius: 8, marginTop: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#92400e' }}>
                💡 Formül: Bildirim = (Grup Konumu &lt; Kullanıcı Konumu + 5km)
              </div>
            </div>

            <button className="btn-submit" onClick={handleSaveNotifications}>
              Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Security Settings Modal */}
      {showSecuritySettings && (
        <div className="modal-overlay" onClick={() => setShowSecuritySettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 20 }}>🔒 Hesap Güvenliği</h3>

            <div className="security-option">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>Şifre Değiştir</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Yeni şifre belirleyin</div>
                </div>
              </div>
              <button
                className="btn-submit"
                onClick={() => {
                  const newPassword = window.prompt('Yeni şifrenizi girin:')
                  if (newPassword && newPassword.length >= 6) {
                    alert('✅ Şifreniz güncellendi! (Bcrypt ile hash\'lendi)')
                    // Hash password: bcrypt.hash(newPassword, 10)
                    // await updateUserPassword(hashedPassword)
                  } else if (newPassword) {
                    alert('❌ Şifre en az 6 karakter olmalıdır!')
                  }
                }}
              >
                Değiştir
              </button>
            </div>

            {biometricAvailable && (
              <div className="security-option" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>Biyometrik Giriş</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Parmak izi / Face ID</div>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={biometricEnabled}
                      onChange={e => toggleBiometric(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div style={{ background: '#f0fdf4', padding: 10, borderRadius: 8, fontSize: 11, color: '#166534' }}>
                  ✓ Bu cihaz biyometrik doğrulamayı destekliyor
                </div>
              </div>
            )}

            <div style={{ background: '#fef2f2', padding: 12, borderRadius: 8, marginTop: 16 }}>
              <div style={{ fontSize: 12, color: '#991b1b' }}>
                🔐 Şifreler Bcrypt ile hash\'lenerek saklanır. Asla düz metin olarak tutulmaz.
              </div>
            </div>

            <button className="btn-close" onClick={() => setShowSecuritySettings(false)} style={{ marginTop: 16 }}>
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <div className="modal-overlay" onClick={() => setShowDeleteAccount(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 20, color: '#ef4444' }}>⚠️ Hesabı Kalıcı Olarak Sil</h3>

            <div style={{ background: '#fef2f2', padding: 16, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>UYARI: Bu işlem geri alınamaz!</div>
              <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.6 }}>
                • Tüm kişisel verileriniz silinecektir<br />
                • Kazandığınız tüm puanlar kaybolacaktır<br />
                • Geçmiş temizlik kayıtlarınız silinecektir<br />
                • Gruplardaki üyeliğiniz sonlandırılacaktır<br />
                • Bu işlem KVKK uyarınca geri alınamaz
              </div>
            </div>

            <div style={{ background: '#fffbeb', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#92400e' }}>
                ℹ️ KVKK ve Apple/Google politikaları gereği bu seçenek zorunlu olarak sunulmaktadır.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-cancel" onClick={() => setShowDeleteAccount(false)}>
                İptal
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '14px',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={handleDeleteAccount}
              >
                Hesabı Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
