# 🔒 Firestore Security Rules - Uygulama Rehberi

## 📋 Genel Bakış

Bu dosya, Temiz Dünya uygulaması için tüm Firestore koleksiyonlarının güvenlik kurallarını içerir.

### Kural Özeti

| Koleksiyon | Kimin Erişimi Var | Açıklama |
|-----------|-----------------|---------|
| `users` | Kendi verileri + Admin | Kullanıcı profilleri (şifreli) |
| `groups` | Üyeler | Gönüllü grupları |
| `reports` | Herkesi | Kirli bölge raporları |
| `photo_verifications` | Admin + Yükleyen | Fotoğraf doğrulaması |
| `cleanup_sessions` | Katılımcılar + Admin | Temizlik oturumları |
| `notifications` | Alıcı + Admin | Bildirimler |
| `user_scores` | Herkesi (public) | Sıralama ve puanlar |
| `leaderboard` | Herkesi | Açık sıralama |
| `admin_config` | Admin | Sistem ayarları |
| `live_operations` | Herkesi | Canlı temizlik operasyonları |

---

## 🚀 Kurulum Adımları

### 1. Firebase Console'a Gitme

1. [Firebase Console](https://console.firebase.google.com/) açın
2. Temiz Dünya projesini seçin
3. Sol menüden **Firestore Database** seçin

### 2. Security Rules Sayfasına Gitme

1. **Rules** sekmesini tıklayın
2. Var olan kuralları silin
3. `firestore.rules` dosyasının tüm içeriğini kopyalayın
4. Firebase Console'daki editöre yapıştırın

### 3. Kuralları Yayınlama

1. **Publish** butonuna tıklayın
2. Uyarı gösterecek, **Publish** ile onaylayın
3. Deployment tamamlanmasını bekleyin (~1 dakika)

---

## 🔐 Güvenlik Özellikleri

### 1. **Kullanıcı Veri Koruması**
```
- ✅ Kullanıcılar sadece kendi profillerini okuyabilir/düzenleyebilir
- ✅ Şifreler asla Firestore'da saklanmaz (Firebase Auth tarafından yönetilir)
- ✅ Admin kullanıcılar tüm profilleri görebilir
- ✅ Kişisel bilgiler (TC, Telefon) korunur
```

### 2. **Grup Üyeliği Kontrolü**
```
- ✅ Sadece grup üyeleri grup verilerine erişebilir
- ✅ Grup oluşturucu grup yöneticisidir
- ✅ Üyeler kendi görevlerini oluşturabilir
- ✅ Aktivite günlüğü otomatik kaydedilir
```

### 3. **Admin Doğrulama**
```
- ✅ Fotoğraf doğrulaması SADECE admin tarafından yapılır
- ✅ Puanlar hile önlemek için sistem tarafından verilir
- ✅ Kullanıcı doğrulaması admin onayı gerektirir
- ✅ Admin ayarları şifrelenmiş
```

### 4. **Oturumlar ve Operasyonlar**
```
- ✅ Cleanup session'ları katılımcılar tarafından güncellenir
- ✅ Live operations herkese görülebilir (sponsorship için)
- ✅ İstatistikler otomatik hesaplanır
- ✅ Notification'lar gizli ve emniyetli
```

---

## ⚠️ Önemli Notlar

### Üretim Ortamında
- 🔴 Test modunda yapılandırılırsa silinebilir! (public write)
- ✅ Bu kurallar production-ready'dir
- ✅ Rate limiting Firebase'te otomatik
- ✅ DDoS koruması etkindir

### Firestore Fiyatlandırması
```
Her işlem (read, write, delete) sizin kullanımınıza göre faturalandırılır:
- Read: 0.06 $/100K işlem
- Write: 0.18 $/100K işlem
- Delete: 0.02 $/100K işlem

Optimize etmek için:
- Gereksiz writes'i azaltın
- Pagination kullanın
- Index'leri doğru kurun
```

---

## 📊 Collection Yapıları

### users/{userId}
```json
{
  "email": "user@example.com",
  "name": "Ahmet",
  "surname": "Yılmaz",
  "phone": "5501234567",
  "age": 28,
  "idNumber": "12345678901",
  "role": "volunteer",  // volunteer, admin, municipality
  "verified": false,
  "emailVerified": false,
  "createdAt": "2025-12-23T10:00:00Z",
  "lastLogin": "2025-12-23T15:30:00Z"
}
```

### groups/{groupId}
```json
{
  "createdBy": "userId",
  "members": ["userId1", "userId2"],
  "location": { "lat": 39.93, "lng": 32.87 },
  "status": "open",  // open, active, completed
  "totalArea": 150.5,
  "totalWeight": 85,
  "createdAt": "2025-12-23T10:00:00Z"
}
```

### reports/{reportId}
```json
{
  "createdBy": "userId",
  "location": { "lat": 39.93, "lng": 32.87 },
  "area": 120,
  "description": "Caddenin sol tarafında çöp birikintisi",
  "status": "open",  // open, in_progress, cleaned
  "image": "storage_url",
  "createdAt": "2025-12-23T10:00:00Z"
}
```

---

## 🧪 Test Etme

### Firebase Emulator ile Test

```bash
# Emulator'u başlat
firebase emulators:start

# Kuralları test et
firebase emulators:exec "npm test"
```

### Manual Test

1. Farklı cihazlardan giriş yapın
2. Başka kullanıcının verisine erişmeyi deneyin
3. Admin paneline gidin
4. Hata loglarını kontrol edin

---

## 🐛 Sorun Giderme

### "Permission denied" hatası alıyorum
```
✅ Çözüm:
1. Firestore rules yayınlandı mı kontrol edin
2. Kullanıcı doğrulanmış mı (Firebase Auth)?
3. İlgili collection'da yetki var mı?
4. Custom claims ayarlı mı (role)?
```

### Performans yavaş
```
✅ Çözüm:
1. Composite index oluşturun (Firebase otomatik önerir)
2. Query'ler optimize edin
3. Pagination ekleyin
4. Batch operations kullanın
```

### Admin işlevleri çalışmıyor
```
✅ Çözüm:
1. Kullanıcının role'ü "admin" mı?
2. Custom claims ayarlandı mı?
3. Firebase CLI ile test edin:
   firebase auth:set:custom:claims <uid> --role=admin
```

---

## 📚 Yararlı Kaynaklar

- [Firebase Security Rules Docs](https://firebase.google.com/docs/firestore/security/start)
- [Rules Language Reference](https://firebase.google.com/docs/rules/rules-language)
- [Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Best Practices](https://firebase.google.com/docs/firestore/best-practices)

---

## ✅ Kontrol Listesi

- [ ] Rules Firebase Console'e yapıştırıldı
- [ ] "Publish" butonu tıklandı
- [ ] Test kullanıcısı kendi verileri okuyabiliyor mu?
- [ ] Admin yönetim paneline erişebiliyor mu?
- [ ] Başka kullanıcının verisine erişilemiyor mu?
- [ ] Fotoğraf doğrulaması admin tarafından yapılabiliyor mu?
- [ ] Notification'lar gizli tutuluyor mu?
