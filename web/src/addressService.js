// addressService.js
// Türkiye Adres Verileri Servisi (Hibrit: API + Manuel)
// Kaynak: https://turkiyeapi.dev/ (Sadece İl ve İlçe)

const API_BASE_URL = 'https://turkiyeapi.dev/api/v1'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days cache

// Fallback Mock Data (Initial Offline Support)
const SAMPLE_CITIES = [
  { id: 1, name: "Adana" }, { id: 6, name: "Ankara" }, { id: 34, name: "İstanbul" }, { id: 35, name: "İzmir" }, { id: 16, name: "Bursa" }
]

// --- Helper: Cache Management ---
const getFromCache = (key) => {
  try {
    const cached = localStorage.getItem(key)
    const expiry = localStorage.getItem(key + '_expiry')
    if (cached && expiry && Date.now() < parseInt(expiry)) {
      return JSON.parse(cached)
    }
  } catch (e) { console.error("Cache read error", e) }
  return null
}

const saveToCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    localStorage.setItem(key + '_expiry', (Date.now() + CACHE_DURATION).toString())
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn("LocalStorage quota exceeded, clearing old address cache...")
      clearAddressCache()
    }
  }
}

// --- API Functions ---

// 1. İlleri Getir
export async function getCities() {
  const cacheKey = 'tr_provinces_hybrid'

  const cached = getFromCache(cacheKey)
  if (cached) return cached.map(p => ({ id: p.id, name: p.name }))

  try {
    const response = await fetch(`${API_BASE_URL}/provinces`)
    if (!response.ok) throw new Error('API Error')

    const result = await response.json()
    if (result.status === 'OK' && result.data) {
      // API returns full object with districts. We cache the FULL object.
      saveToCache(cacheKey, result.data)
      return result.data.map(p => ({ id: p.id, name: p.name }))
    }
  } catch (err) {
    console.warn("Cities fetch failed, using fallback:", err)
    return SAMPLE_CITIES
  }
  return SAMPLE_CITIES
}

// 2. İlçeleri Getir (Cache'den okur)
export async function getDistricts(cityId) {
  const cacheKey = 'tr_provinces_hybrid'
  let provinces = getFromCache(cacheKey)

  if (!provinces) {
    await getCities()
    provinces = getFromCache(cacheKey)
  }

  if (provinces) {
    const city = provinces.find(p => p.id === parseInt(cityId))
    if (city && city.districts) {
      return city.districts.map(d => ({ id: d.id, name: d.name }))
    }
  }
  return []
}

// 3. Mahalleleri Getir (MANUEL GİRİŞ İÇİN BOŞ DÖNER)
// Kullanıcı isteği üzerine mahalleler otomatik gelmeyecek, kullanıcı elle girecek.
export async function getNeighborhoods(districtId) {
  return [] // Boş liste dönmesi UI'da text input'a geçişi tetikleyebilir veya UI bunu handle etmeli
}

// 4. Köyleri Getir (MANUEL GİRİŞ İÇİN BOŞ DÖNER)
export async function getVillages(districtId) {
  return []
}

// 5. İsimden Şehir ID Bul
export async function getCityIdByName(cityName) {
  const cities = await getCities()
  const found = cities.find(c => c.name.toLowerCase() === cityName.toLowerCase())
  return found ? found.id : null
}

export function searchItems(items, query) {
  if (!items) return []
  if (!query) return items
  const lowerQuery = query.toLocaleLowerCase('tr')
  return items.filter(item => item.name.toLocaleLowerCase('tr').includes(lowerQuery))
}

// 6. Koordinattan Şehir Bul (Basit tahmin)
export async function getCityFromCoordinates(lat, lng) {
  let cityName = null
  // Demo amaçlı basit kontrol
  if (lat > 36.5 && lat < 37.5 && lng > 35 && lng < 36) cityName = 'Adana'
  else if (lat > 40.8 && lat < 41.2 && lng > 28.5 && lng < 29.5) cityName = 'İstanbul'
  // Ankara coordinates approx
  else if (lat > 39.0 && lat < 40.5 && lng > 32.0 && lng < 33.5) cityName = 'Ankara'

  if (cityName) {
    const cities = await getCities()
    const found = cities.find(c => c.name === cityName)
    if (found) return found
  }
  return null
}

// --- Cache Temizleme ---
export function clearAddressCache() {
  localStorage.removeItem('tr_provinces_hybrid')
  localStorage.removeItem('tr_provinces_hybrid_expiry')
  console.log('Adres önbelleği temizlendi.')
}
