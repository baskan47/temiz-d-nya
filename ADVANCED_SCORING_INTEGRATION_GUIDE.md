# Advanced Scoring Algorithm Integration Guide

## 📋 Genel Bakış

Bu guide, Temiz Dünya platformunda Advanced Scoring Algorithm'ı mevcut sisteme entegre etmek için talimatlar içerir.

## 🎯 Hedefler

- ✅ Basit alan × ağırlık formülü yerine çok faktörlü scoring
- ✅ Zorluk, aciliyet, takım verimliliği ve doğrulama gibi faktörler
- ✅ Başarılar ve lider tablosu desteği
- ✅ Bonus ve çarpan mekanizmaları

## 📊 Scoring Formülü

```
Total Score = (Weight × 0.30) + (Difficulty × 0.20) + (Urgency × 0.15) + 
              (Team Efficiency × 0.20) + (Verification Bonus × 0.10) + (Time × 0.05)
```

### Faktörler

1. **Weight (30%)**
   - Temizlik alanı/çabası (0-10 scale)
   - Score: weight × 10

2. **Difficulty (20%)**
   - Zorluk seviyesi (1-5 scale)
   - Score: 20 + (difficulty-1) × 20

3. **Urgency (15%)**
   - Aciliyet faktörü (1-5 scale)
   - Score: 20 + (urgency-1) × 20

4. **Team Efficiency (20%)**
   - Takım verimliliği
   - Üye sayısı + tamamlanma yüzdesi
   - Score: 0-100

5. **Verification Bonus (10%)**
   - Fotoğraf doğrulanması
   - Score: 0 (unverified) veya 100 (verified)

6. **Time Factor (5%)**
   - Harcanan zaman
   - 0-1h: 20, 1-2h: 50, 2-4h: 80, 4+h: 100

## 🚀 Implementasyon Adımları

### 1. Flutter Tarafında

#### Step 1.1: Cleanup Session Modeline Yeni Alanlar Ekle

```dart
// models.dart'a ekle
class CleanupSession {
  final String id;
  final String userId;
  final String groupId;
  final double weight;
  final int difficulty;  // 1-5
  final int urgency;     // 1-5
  final double durationHours;
  final bool photoVerified;
  final int membersCount;
  final double completionPercentage;
  final double earnedPoints;
  final DateTime createdAt;

  CleanupSession({
    required this.id,
    required this.userId,
    required this.groupId,
    required this.weight,
    required this.difficulty,
    required this.urgency,
    required this.durationHours,
    required this.photoVerified,
    required this.membersCount,
    required this.completionPercentage,
    required this.earnedPoints,
    required this.createdAt,
  });
}
```

#### Step 1.2: Firestore Service'e Advanced Scoring Entegrasyonu

```dart
// firestore_service.dart'a ekle
import 'scoring_algorithm.dart';

Future<void> calculateAndUpdateCleanupScore({
  required String userId,
  required String groupId,
  required int weight,
  required int difficulty,
  required int urgency,
  required int membersCount,
  required double completionPercentage,
  required bool isVerified,
  required double hoursSpent,
}) async {
  try {
    // Advanced scoring'i hesapla
    final score = AdvancedScoringAlgorithm.calculateTotalScore(
      weight: weight,
      difficulty: difficulty,
      urgency: urgency,
      membersCount: membersCount,
      completionPercentage: completionPercentage,
      isVerified: isVerified,
      hoursSpent: hoursSpent,
    );

    // Cleanup session'ı kaydet
    final sessionRef = await _db.collection('cleanup_sessions').add({
      'userId': userId,
      'groupId': groupId,
      'weight': weight,
      'difficulty': difficulty,
      'urgency': urgency,
      'membersCount': membersCount,
      'completionPercentage': completionPercentage,
      'photoVerified': isVerified,
      'durationHours': hoursSpent,
      'earnedPoints': score,
      'scoreBreakdown': AdvancedScoringAlgorithm.getScoreBreakdown(
        weight: weight,
        difficulty: difficulty,
        urgency: urgency,
        membersCount: membersCount,
        completionPercentage: completionPercentage,
        isVerified: isVerified,
        hoursSpent: hoursSpent,
      ),
      'createdAt': FieldValue.serverTimestamp(),
    });

    // Kullanıcı puanını güncelle
    await updateUserPoints(userId, score);

    // Başarıları kontrol et ve güncelle
    await checkAndAwardAchievements(userId);

  } catch (e) {
    print('Cleanup score calculation error: $e');
    rethrow;
  }
}
```

#### Step 1.3: Başarı Sistemi

```dart
// firestore_service.dart'a ekle
Future<void> checkAndAwardAchievements(String userId) async {
  try {
    final userDoc = await _db.collection('users').doc(userId).get();
    final userData = userDoc.data() ?? {};

    final totalCleanups = userData['cleanupCount'] ?? 0;
    final verifiedPhotos = userData['verifiedPhotosCount'] ?? 0;
    final consecutiveDays = userData['consecutiveDays'] ?? 0;
    final maxDifficulty = userData['maxDifficulty'] ?? 0;

    final achievements = AdvancedScoringAlgorithm.checkAchievements(
      totalCleanups: totalCleanups,
      verifiedPhotos: verifiedPhotos,
      averageEfficiency: (userData['averageEfficiency'] ?? 0).toDouble(),
      consecutiveDays: consecutiveDays,
      maxDifficulty: maxDifficulty,
    );

    if (achievements.isNotEmpty) {
      await _db.collection('users').doc(userId).update({
        'achievements': FieldValue.arrayUnion(achievements),
      });
    }
  } catch (e) {
    print('Achievement check error: $e');
  }
}
```

### 2. Web Tarafında

#### Step 2.1: JavaScript Entegrasyonu

```javascript
// firestoreService.js veya firebase işlemleri yapılan yerde
import { AdvancedScoringAlgorithm } from './scoringAlgorithm'

export async function calculateAndUpdateCleanupScore({
  userId,
  groupId,
  weight,
  difficulty,
  urgency,
  membersCount,
  completionPercentage,
  isVerified,
  hoursSpent,
}) {
  try {
    // Advanced scoring hesapla
    const score = AdvancedScoringAlgorithm.calculateTotalScore({
      weight,
      difficulty,
      urgency,
      membersCount,
      completionPercentage,
      isVerified,
      hoursSpent,
    })

    // Cleanup session kaydet
    const docRef = await db.collection('cleanup_sessions').add({
      userId,
      groupId,
      weight,
      difficulty,
      urgency,
      membersCount,
      completionPercentage,
      photoVerified: isVerified,
      durationHours: hoursSpent,
      earnedPoints: score,
      scoreBreakdown: AdvancedScoringAlgorithm.getScoreBreakdown({
        weight,
        difficulty,
        urgency,
        membersCount,
        completionPercentage,
        isVerified,
        hoursSpent,
      }),
      createdAt: new Date(),
    })

    // Kullanıcı puanını güncelle
    await updateUserPoints(userId, score)

    // Başarıları kontrol et
    await checkAndAwardAchievements(userId)

    return { sessionId: docRef.id, score }
  } catch (error) {
    console.error('Cleanup score calculation error:', error)
    throw error
  }
}
```

### 3. Firestore Collection Şeması Güncellemesi

```
cleanup_sessions/
  {sessionId}:
    - userId: string
    - groupId: string
    - weight: number (0-10)
    - difficulty: number (1-5)
    - urgency: number (1-5)
    - membersCount: number
    - completionPercentage: number (0-100)
    - photoVerified: boolean
    - durationHours: number
    - earnedPoints: number (calculated score)
    - scoreBreakdown: object {
        weight: number,
        difficulty: number,
        urgency: number,
        efficiency: number,
        verification: number,
        time: number,
        total: number
      }
    - createdAt: timestamp

user_scores/
  {userId}:
    - userId: string
    - ecoPoints: number
    - badge: string (bronze, silver, gold, platinum)
    - level: string (novice, beginner, ..., master)
    - cleanupCount: number
    - verifiedPhotosCount: number
    - consecutiveDays: number
    - maxDifficulty: number
    - averageEfficiency: number
    - achievements: array<string>
    - totalScore: number (cumulative)
    - lastUpdated: timestamp
```

## 📱 UI Components Güncellemesi

### Score Display Component

```dart
// Flutter
Widget buildScoreDisplay(Map<String, double> breakdown) {
  return Column(
    children: [
      Text('${breakdown['total']?.toInt() ?? 0} Puan',
        style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
      
      ScoreFactorBar('Ağırlık', breakdown['weight'] ?? 0, 0.30),
      ScoreFactorBar('Zorluk', breakdown['difficulty'] ?? 0, 0.20),
      ScoreFactorBar('Aciliyet', breakdown['urgency'] ?? 0, 0.15),
      ScoreFactorBar('Verimlilik', breakdown['efficiency'] ?? 0, 0.20),
      ScoreFactorBar('Doğrulama', breakdown['verification'] ?? 0, 0.10),
      ScoreFactorBar('Zaman', breakdown['time'] ?? 0, 0.05),
    ],
  );
}
```

```jsx
// React
function ScoreDisplay({ breakdown }) {
  return (
    <div className="score-display">
      <div className="total-score">
        {Math.round(breakdown?.total || 0)} Puan
      </div>
      
      <div className="score-breakdown">
        <ScoreFactor name="Ağırlık" value={breakdown?.weight} weight={0.30} />
        <ScoreFactor name="Zorluk" value={breakdown?.difficulty} weight={0.20} />
        <ScoreFactor name="Aciliyet" value={breakdown?.urgency} weight={0.15} />
        <ScoreFactor name="Verimlilik" value={breakdown?.efficiency} weight={0.20} />
        <ScoreFactor name="Doğrulama" value={breakdown?.verification} weight={0.10} />
        <ScoreFactor name="Zaman" value={breakdown?.time} weight={0.05} />
      </div>
    </div>
  );
}
```

## 🔄 Migration İçin

### Eski Puanları Dönüştürmek

```javascript
// Migration script
async function migrateOldScores() {
  const usersRef = db.collection('users');
  const querySnapshot = await usersRef.get();

  for (const doc of querySnapshot.docs) {
    const userData = doc.data();
    const oldEcoPoints = userData.ecoPoints || 0;

    // Eski puanları 1.5x ile çarp (uyarlanma)
    const migratedPoints = Math.round(oldEcoPoints * 1.5);

    await doc.ref.update({
      ecoPoints: migratedPoints,
      legacyPoints: oldEcoPoints,
      migrationDate: new Date(),
    });
  }
}
```

## 📊 Örnek Senaryolar

### Senaryo 1: Kolay Temizlik
```
weight: 2, difficulty: 1, urgency: 1, 
membersCount: 1, completionPercentage: 50,
isVerified: false, hoursSpent: 0.5

Score = (20 × 0.30) + (20 × 0.20) + (20 × 0.15) + 
         (50 × 0.20) + (0 × 0.10) + (20 × 0.05) = 23 points
```

### Senaryo 2: Zor Grup Temizliği
```
weight: 8, difficulty: 5, urgency: 4,
membersCount: 5, completionPercentage: 100,
isVerified: true, hoursSpent: 3

Score = (80 × 0.30) + (100 × 0.20) + (80 × 0.15) +
         (75 × 0.20) + (100 × 0.10) + (80 × 0.05) = 81.5 points

Team Bonus: × 1.20 = 97.8 points
```

## 🧪 Test Yönergeleri

```bash
# Flutter
flutter test test/scoring_algorithm_test.dart

# Web
npm run test -- scoring

# Coverage
npm run test:coverage
```

## 🔗 İlgili Dosyalar

- `flutter/lib/scoring_algorithm.dart` - Dart implementation
- `web/src/scoringAlgorithm.js` - JavaScript implementation
- `flutter/test/scoring_algorithm_test.dart` - Flutter tests
- `web/src/__tests__/scoringAlgorithm.test.js` - Web tests

## 📞 Notlar

- Tüm puanlar 0-100 aralığında normalized edilmiş
- Bonuslar final score'u 100'ü aşabilir (max 200)
- Badge'ler otomatik olarak hesaplanır
- Başarılar incremental olarak açılır

## ✅ Checklist

- [ ] Models'da yeni alanları ekle
- [ ] Firestore schema'yı güncelle
- [ ] Firebase rules'ları güncelle
- [ ] Cleanup form'unda difficulty/urgency selector'ları ekle
- [ ] Score display component'ini implement et
- [ ] Achievement system'i activate et
- [ ] Leaderboard'u güncellemelerine göre güncelle
- [ ] Database migration'ları çalıştır
- [ ] Tüm testleri geçir
- [ ] Production'a deploy et

## ⚙️ Admin Panel - Scoring Ayarları

### Genel Bakış

Admin Panel, scoring sisteminin tüm parametrelerini dinamik olarak yönetmek için tasarlanmıştır. Admin kullanıcılar, uygulamayı yeniden dağıtmadan scoring ağırlıklarını, bonus çarpanlarını ve başarı puanlarını ayarlayabilir.

### Web Admin Panel (React)

#### Dosya: `web/src/AdminScoringPanel.jsx`

```jsx
import { AdminScoringPanel } from './AdminScoringPanel'

// App.jsx veya routing'e ekle
<Route path="/admin/scoring" element={<AdminScoringPanel />} />
```

**Özellikler:**
- 5 tab: Faktörler, Bonuslar, Başarılar, Eşikler, Geçmiş
- Real-time form validation
- Değişiklik geçmişi tracking
- One-click reset to defaults
- Turkish language UI

**Faktörler Tab:**
- WEIGHT (Ağırlık): 0-1 (default 0.30)
- DIFFICULTY (Zorluk): 0-1 (default 0.20)
- URGENCY (Aciliyet): 0-1 (default 0.15)
- EFFICIENCY (Verimlilik): 0-1 (default 0.20)
- VERIFICATION (Doğrulama): 0-1 (default 0.10)
- TIME (Zaman): 0-1 (default 0.05)
- Uyarı: Toplam 1.0 olmalı

**Bonuslar Tab:**
- Leaderboard Bonusları:
  - Top 10: 1.20 (default)
  - Top 50: 1.10 (default)
  - Top 100: 1.05 (default)
- Çizgi Bonusu: 1.02 per day
- Takım Verimliliği:
  - Solo: 1.0 (no bonus)
  - Small (2-3): 1.10
  - Medium (4-5): 1.20
  - Large (6+): 1.30

**Başarılar Tab:**
- 10 achievement types için puan ayarı
- Her başarı için puan atama

**Eşikler Tab:**
- Badge thresholds (Bronze, Silver, Gold, Platinum)
- Level thresholds (6 levels: Novice → Master)

**Geçmiş Tab:**
- Tüm ayar değişikliklerinin kaydı
- Değişiklik zamanı ve yapanı
- Değişiklik detayları

### Flutter Admin Panel (Dart)

#### Dosya: `flutter/lib/admin_scoring_screen.dart`

```dart
// main.dart navigation'a ekle
if (userRole == 'admin')
  navigateTo(AdminScoringScreen())
```

**Özellikler:**
- Web ile aynı functionality
- Sliders ve inputs ile kolay düzenleme
- Real-time validation
- Offline draft support (optional)

### Firestore Schema

```
admin_config/
  scoring:
    - scoreFactors: object
      - WEIGHT: 0.30
      - DIFFICULTY: 0.20
      - URGENCY: 0.15
      - EFFICIENCY: 0.20
      - VERIFICATION: 0.10
      - TIME: 0.05
    - bonusMultipliers: object
      - leaderboardTop10: 1.20
      - leaderboardTop50: 1.10
      - leaderboardTop100: 1.05
      - streakMultiplier: 1.02
      - teamEfficiencyBonus: object
        - solo: 1.0
        - small: 1.10
        - medium: 1.20
        - large: 1.30
    - achievements: object (10 types)
    - badgeThresholds: object (4 badges)
    - levelThresholds: object (6 levels)
    - lastUpdated: timestamp
    - updatedBy: string (user email)

admin_config_history/
  {docId}:
    - timestamp: timestamp
    - changedBy: string
    - changes: string (JSON stringified)
    - config: object (full config snapshot)
```

### Firestore Security Rules

```rules
// ==================== ADMIN CONFIG ====================
// Scoring configuration - read by all, write by admin only
match /admin_config/{docId} {
  // All authenticated users can read config
  allow read: if request.auth.uid != null;
  
  // Only admin can write
  allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  
  // History subcollection - admin only
  match /history/{historyId} {
    allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    allow create: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  }
}

// Admin config history collection
match /admin_config_history/{docId} {
  // Only admin can read and write
  allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### Integration ile Scoring

Scoring algoritması runtime'da admin config'i şu şekilde yükler:

**Web (JavaScript):**
```javascript
// scoringAlgorithm.js'de
export async function initializeWithAdminConfig(db) {
  const config = await getAdminConfig(db)
  AdvancedScoringAlgorithm.config = config || DEFAULT_CONFIG
}

// calculateTotalScore'da
const score = AdvancedScoringAlgorithm.calculateTotalScore({
  weight,
  difficulty,
  urgency,
  membersCount,
  completionPercentage,
  isVerified,
  hoursSpent,
  // Uses AdvancedScoringAlgorithm.config internally
})
```

**Flutter (Dart):**
```dart
// scoring_algorithm.dart'de
class AdvancedScoringAlgorithm {
  static Map<String, dynamic> _adminConfig = DEFAULT_CONFIG;

  static Future<void> initializeWithAdminConfig() async {
    final doc = await FirebaseFirestore.instance
        .collection('admin_config')
        .doc('scoring')
        .get();
    
    _adminConfig = doc.data() ?? DEFAULT_CONFIG;
  }

  static double calculateTotalScore({...}) {
    // Uses _adminConfig for factor calculations
  }
}
```

### Kullanım Örneği

#### Admin tarafından yapılacaklar:

1. **Admin paneline git:** Web: `/admin/scoring` | Mobile: Admin menu
2. **Faktörleri düzenle:** Örneğin, WEIGHT'ı 0.25'e düşür
3. **Kaydet** butonuna tıkla
4. **Geçmiş** tab'ında değişiklikleri doğrula
5. **Sıfırla** ile varsayılan ayarlara dönebilir

#### Sonuçlar:

- Tüm yeni cleanup sessions bu config'i kullanır
- Mevcut leaderboard etkilenmez (immutable)
- Değişiklik history 50 son kaydı tutar
- Audit trail: Kim ne zaman değiştirdi?

### Best Practices

1. **Faktörleri Dengele:** Toplam her zaman 1.0 olmalı
2. **Bonusları Makul Tutun:** 0.5x - 2.0x aralığında tutun
3. **Başarıları Ayarla:** Cleanup count'a göre milestone'ları ayarla
4. **Staging'te Test Et:** Production öncesi staging'te değişiklikleri test et
5. **Geçmişi İzle:** Periyodik olarak geçmiş kaydını kontrol et

### Sorun Giderme

**Problema:** Config değişiklikleri uygulanmıyor
- Çözüm: Uygulamayı yeniden başlat veya cache'i temizle

**Problema:** Admin paneline erişilemiyor
- Çözüm: Kullanıcı role'ünün 'admin' olduğundan emin ol

**Problema:** Geçmiş verisi görülmüyor
- Çözüm: Firestore collection browser'ında admin_config_history'i kontrol et

## 📝 İlgili Fonksiyonlar

**Web (JavaScript):**
- `getAdminConfig(db)` - Mevcut config'i al
- `updateAdminConfig(db, config)` - Config'i güncelle ve geçmişe ekle
- `getConfigHistory(db)` - Son 50 değişikliği al
- `resetConfigToDefaults(db)` - Varsayılana sıfırla

**Flutter (Dart):**
- `AdvancedScoringAlgorithm.initializeWithAdminConfig()` - App startup'ta
- `FirebaseFirestore.collection('admin_config').doc('scoring').get()` - Config al
- `FirebaseFirestore.collection('admin_config_history').orderBy('timestamp', descending: true).limit(50)` - Geçmiş al
