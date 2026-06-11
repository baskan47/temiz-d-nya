import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:typed_data';
import 'dart:math';
import 'scoring_algorithm.dart';
import 'models.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Raporları izle
  Stream<List<Map<String, dynamic>>> watchIncomingReports() {
    return _db.collection('reports')
        .where('status', whereIn: ['dirty', 'cleaning', 'cleaned', 'open', 'in_progress'])
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
  }

  // Grupları izle
  Stream<List<Map<String, dynamic>>> watchGroups() {
    return _db.collection('groups')
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
  }

  // Kullanıcı puanını güncelle (basit increment)
  Future<void> updateUserPoints(String userId, double points) async {
    await _db.collection('users').doc(userId).update({'ecoPoints': FieldValue.increment(points)});
  }

  // Gelişmiş scoring ile cleanup puanını hesapla ve güncelle
  Future<Map<String, dynamic>> calculateAndUpdateCleanupScore({
    required String userId,
    required String groupId,
    required double weight,
    required int difficulty,
    required int urgency,
    required int membersCount,
    required double completionPercentage,
    required bool isPhotoVerified,
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
        isVerified: isPhotoVerified,
        hoursSpent: hoursSpent,
      );

      // Score breakdown'ı al
      final breakdown = AdvancedScoringAlgorithm.getScoreBreakdown(
        weight: weight,
        difficulty: difficulty,
        urgency: urgency,
        membersCount: membersCount,
        completionPercentage: completionPercentage,
        isVerified: isPhotoVerified,
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
        'photoVerified': isPhotoVerified,
        'durationHours': hoursSpent,
        'earnedPoints': score,
        'scoreBreakdown': breakdown,
        'createdAt': FieldValue.serverTimestamp(),
      });

      // Kullanıcı puanını güncelle
      await _db.collection('users').doc(userId).update({
        'ecoPoints': FieldValue.increment(score),
        'cleanupCount': FieldValue.increment(1),
        'lastCleanupAt': FieldValue.serverTimestamp(),
      });

      // user_scores collection'ını güncelle
      await _updateUserScore(userId, score, isPhotoVerified);

      // Başarıları kontrol et ve güncelle
      await _checkAndAwardAchievements(userId);

      return {
        'sessionId': sessionRef.id,
        'score': score,
        'breakdown': breakdown,
      };
    } catch (e) {
      print('Cleanup score calculation error: $e');
      rethrow;
    }
  }

  // User score document'ını güncelle
  Future<void> _updateUserScore(String userId, double score, bool verified) async {
    try {
      final userScoreDoc = _db.collection('user_scores').doc(userId);
      final snapshot = await userScoreDoc.get();

      if (snapshot.exists) {
        final currentData = snapshot.data() ?? {};
        final currentTotal = (currentData['totalScore'] ?? 0).toDouble();
        final newTotal = currentTotal + score;

        await userScoreDoc.update({
          'totalScore': newTotal,
          'ecoPoints': FieldValue.increment(score),
          'cleanupCount': FieldValue.increment(1),
          'verifiedPhotosCount': verified ? FieldValue.increment(1) : FieldValue.increment(0),
          'lastUpdated': FieldValue.serverTimestamp(),
          'badge': AdvancedScoringAlgorithm.determineBadge(newTotal),
          'level': AdvancedScoringAlgorithm.determineLevel(newTotal),
        });
      } else {
        // Yeni user_scores dokümanı oluştur
        await userScoreDoc.set({
          'userId': userId,
          'totalScore': score,
          'ecoPoints': score,
          'cleanupCount': 1,
          'verifiedPhotosCount': verified ? 1 : 0,
          'consecutiveDays': 0,
          'maxDifficulty': 0,
          'averageEfficiency': 0,
          'achievements': verified ? ['photo_verified'] : [],
          'badge': AdvancedScoringAlgorithm.determineBadge(score),
          'level': AdvancedScoringAlgorithm.determineLevel(score),
          'lastUpdated': FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      print('User score update error: $e');
    }
  }

  // Başarıları kontrol et ve say
  Future<void> _checkAndAwardAchievements(String userId) async {
    try {
      final userScoreDoc = await _db.collection('user_scores').doc(userId).get();
      final userData = userScoreDoc.data() ?? {};

      final totalCleanups = (userData['cleanupCount'] ?? 0) as int;
      final verifiedPhotos = (userData['verifiedPhotosCount'] ?? 0) as int;
      final consecutiveDays = (userData['consecutiveDays'] ?? 0) as int;
      final maxDifficulty = (userData['maxDifficulty'] ?? 0) as int;

      final achievements = AdvancedScoringAlgorithm.checkAchievements(
        totalCleanups: totalCleanups,
        verifiedPhotos: verifiedPhotos,
        averageEfficiency: (userData['averageEfficiency'] ?? 0).toDouble(),
        consecutiveDays: consecutiveDays,
        maxDifficulty: maxDifficulty,
      );

      if (achievements.isNotEmpty) {
        final currentAchievements = List<String>.from(userData['achievements'] ?? []);
        final newAchievements = achievements.where((a) => !currentAchievements.contains(a)).toList();

        if (newAchievements.isNotEmpty) {
          await _db.collection('user_scores').doc(userId).update({
            'achievements': FieldValue.arrayUnion(newAchievements),
          });
        }
      }
    } catch (e) {
      print('Achievement check error: $e');
    }
  }

  // Temizlik oturumu kaydet (eski method - compatibility için)
  Future<void> saveCleanupSession(Map<String, dynamic> data) async {
    await _db.collection('cleanup_sessions').add({
      ...data,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  // Rapor durumunu 'cleaned' yap
  Future<void> markReportAsCleaned(String reportId, String cleanedByUserId) async {
    await _db.collection('reports').doc(reportId).update({
      'status': 'cleaned',
      'cleanedBy': cleanedByUserId,
      'cleanedAt': FieldValue.serverTimestamp(),
    });
  }

  // Yeni kirli alan raporu ekle
  Future<void> submitReport(Map<String, dynamic> data) async {
    await _db.collection('reports').add({
      ...data,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  // Grup oluştur (Kod ile)
  Future<String> createGroupWithCode(String name, String targetArea, String leaderId) async {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = Random();
    final joinCode = String.fromCharCodes(Iterable.generate(
      6, (_) => chars.codeUnitAt(random.nextInt(chars.length))));

    final groupRef = await _db.collection('groups').add({
      'name': name,
      'targetArea': targetArea,
      'leaderId': leaderId,
      'joinCode': joinCode,
      'members': [leaderId],
      'status': 'ready', // ready, cleaning, break
      'createdAt': FieldValue.serverTimestamp(),
      'areaSqMeters': 0,
      'progressValue': 0.0,
      'countdownSeconds': 2700,
    });
    return groupRef.id;
  }

  // Gruba katıl (Kod ile)
  Future<bool> joinGroupByCode(String joinCode, String userId) async {
    final snapshot = await _db.collection('groups').where('joinCode', isEqualTo: joinCode.toUpperCase().trim()).limit(1).get();
    if (snapshot.docs.isNotEmpty) {
      await snapshot.docs.first.reference.update({
        'members': FieldValue.arrayUnion([userId])
      });
      return true;
    }
    return false;
  }

  // Kullanıcının üye olduğu tüm grupları dinle
  Stream<List<DocumentSnapshot>> watchUserGroups(String userId) {
    return _db.collection('groups')
      .where('members', arrayContains: userId)
      .snapshots()
      .map((snapshot) {
        // Bellekte sıralama yapıyoruz (Index gereksinimini aşmak için)
        final docs = snapshot.docs;
        docs.sort((a, b) {
          final aData = a.data() as Map<String, dynamic>;
          final bData = b.data() as Map<String, dynamic>;
          final aTime = aData['createdAt'] as Timestamp?;
          final bTime = bData['createdAt'] as Timestamp?;
          
          // Yeni oluşturulan (timestamp henüz gelmemiş) dokümanları en üste al
          if (aTime == null && bTime == null) return 0;
          if (aTime == null) return -1;
          if (bTime == null) return 1;
          
          return bTime.compareTo(aTime); // Azalan (Yeni en üstte)
        });
        return docs;
      });
  }

  // Gruptan çık
  Future<void> leaveGroup(String groupId, String userId) async {
    await _db.collection('groups').doc(groupId).update({
      'members': FieldValue.arrayRemove([userId])
    });
  }

  // Grup durumunu veya sayacını güncelle
  Future<void> updateGroupData(String groupId, Map<String, dynamic> data) async {
     await _db.collection('groups').doc(groupId).update(data);
  }

  // Grup üyelerinin bilgilerini getir
  Future<List<Map<String, dynamic>>> getGroupMembers(List<dynamic> memberIds) async {
    if (memberIds.isEmpty) return [];
    try {
      final snapshot = await _db.collection('users').where(FieldPath.documentId, whereIn: memberIds.take(10).toList()).get();
      return snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList();
    } catch (e) {
      return [];
    }
  }

  // Gruba davet gönder
  Future<void> sendGroupInvite(String groupId, String fromId, String toId) async {
    await _db.collection('group_invites').add({
      'groupId': groupId,
      'fromId': fromId,
      'toId': toId,
      'status': 'pending',
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  // Grup Mesajlarını Gönder
  Future<void> sendGroupMessage(String groupId, String senderId, String senderName, String text) async {
    await _db.collection('groups').doc(groupId).collection('messages').add({
      'senderId': senderId,
      'senderName': senderName,
      'text': text,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  // Grup Mesajlarını Dinle
  Stream<List<Map<String, dynamic>>> watchGroupMessages(String groupId) {
    return _db.collection('groups').doc(groupId).collection('messages')
        .orderBy('createdAt', descending: true)
        .limit(20)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
  }

  // ── Arkadaşlık Sistemleri ──────────────────────────────────────────────────
  
  // Short ID ile kullanıcı ara (Gizlilik: Sadece halka açık veriler)
  Future<Map<String, dynamic>?> searchUserByShortId(String shortId) async {
    final snapshot = await _db.collection('users')
        .where('shortId', isEqualTo: shortId.toUpperCase().trim())
        .limit(1)
        .get();
    
    if (snapshot.docs.isNotEmpty) {
      final data = snapshot.docs.first.data();
      return {
        'id': snapshot.docs.first.id,
        'name': data['name'],
        'shortId': data['shortId'],
        'ecoPoints': data['ecoPoints'],
        'cleanupCount': data['cleanupCount'],
        'photoUrl': data['photoUrl'],
        'level': data['level'],
        'badge': data['badge'],
      };
    }
    return null;
  }

  // Arkadaşlık isteği gönder
  Future<void> sendFriendRequest(String fromId, String toId) async {
    if (fromId == toId) return;
    
    final requestId = fromId.hashCode ^ toId.hashCode; // Basit deterministik ID
    await _db.collection('friend_requests').doc(requestId.toString()).set({
      'fromId': fromId,
      'toId': toId,
      'status': 'pending',
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  // Arkadaşlık isteğini kabul et
  Future<void> acceptFriendRequest(String requestId, String fromId, String toId) async {
    await _db.runTransaction((transaction) async {
      // 1. İsteği güncelle
      transaction.update(_db.collection('friend_requests').doc(requestId), {'status': 'accepted'});
      
      // 2. Her iki kullanıcının arkadaş listesine ekle
      final fromUserFriends = _db.collection('users').doc(fromId).collection('friends').doc(toId);
      final toUserFriends = _db.collection('users').doc(toId).collection('friends').doc(fromId);
      
      transaction.set(fromUserFriends, {'friendId': toId, 'addedAt': FieldValue.serverTimestamp()});
      transaction.set(toUserFriends, {'friendId': fromId, 'addedAt': FieldValue.serverTimestamp()});
    });
  }

  // Arkadaş listesini dinle (Filtreli Veri)
  Stream<List<Map<String, dynamic>>> watchFriends(String userId) {
    return _db.collection('users').doc(userId).collection('friends').snapshots().asyncMap((snapshot) async {
      final friendIds = snapshot.docs.map((doc) => doc.id).toList();
      if (friendIds.isEmpty) return [];
      
      final usersSnapshot = await _db.collection('users').where(FieldPath.documentId, whereIn: friendIds.take(10).toList()).get();
      return usersSnapshot.docs.map((doc) {
        final data = doc.data();
        return {
          'id': doc.id,
          'name': data['name'],
          'shortId': data['shortId'],
          'ecoPoints': data['ecoPoints'],
          'cleanupCount': data['cleanupCount'],
          'photoUrl': data['photoUrl'],
          'level': data['level'],
          'badge': data['badge'],
        };
      }).toList();
    });
  }

  // Gelen arkadaşlık isteklerini dinle
  Stream<List<Map<String, dynamic>>> watchIncomingRequests(String userId) {
    return _db.collection('friend_requests')
        .where('toId', isEqualTo: userId)
        .where('status', isEqualTo: 'pending')
        .snapshots()
        .asyncMap((snapshot) async {
          List<Map<String, dynamic>> results = [];
          for (var doc in snapshot.docs) {
            final data = doc.data();
            final fromId = data['fromId'];
            final userDoc = await _db.collection('users').doc(fromId).get();
            results.add({
              'id': doc.id,
              'fromId': fromId,
              'fromName': userDoc.data()?['name'] ?? 'Bilinmeyen Kullanıcı',
              'fromShortId': userDoc.data()?['shortId'] ?? '',
              'createdAt': data['createdAt'],
            });
          }
          return results;
        });
  }

  // İsteği reddet
  Future<void> declineFriendRequest(String requestId) async {
    await _db.collection('friend_requests').doc(requestId).delete();
  }

  // ── Admin Dashboard Servisleri ─────────────────────────────────────────────

  // Genel Admin İstatistiklerini Getir
  Future<Map<String, dynamic>> getAdminStats() async {
    try {
      // Toplam Atık Hesaplama
      final sessionsSnapshot = await _db.collection('cleanup_sessions').get();
      double totalWeight = 0;
      for (var doc in sessionsSnapshot.docs) {
        totalWeight += (doc.data()['weight'] ?? 0).toDouble();
      }

      // Aktif Gönüllü Sayısı
      final usersSnapshot = await _db.collection('users').get();
      final activeVolunteersCount = usersSnapshot.size;

      // Riskli Bölgeler (Aciliyeti yüksek olan raporların bulunduğu benzersiz yerler)
      final riskyReports = await _db.collection('reports')
          .where('urgency', isGreaterThanOrEqualTo: 4)
          .where('status', isEqualTo: 'open')
          .get();
      
      final Set<String> uniqueDistricts = {};
      for (var doc in riskyReports.docs) {
        uniqueDistricts.add(doc.data()['district'] ?? 'Bilinmeyen');
      }

      return {
        'totalWaste': totalWeight / 1000, // Ton cinsinden
        'activeVolunteers': activeVolunteersCount,
        'riskyZones': uniqueDistricts.length,
        'aiAccuracy': 98.4, // Bu değer AI loglarından hesaplanabilir
      };
    } catch (e) {
      print("Admin Stats Error: $e");
      return {'totalWaste': 0, 'activeVolunteers': 0, 'riskyZones': 0, 'aiAccuracy': 0};
    }
  }

  // AI Onay Kuyruğunu Dinle
  Stream<List<Map<String, dynamic>>> watchAdminVerificationQueue() {
    return _db.collection('reports')
        .where('status', isEqualTo: 'open')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
  }

  // Raporu Onayla/Reddet (Admin Kararı)
  Future<void> processAdminDecision(String reportId, bool isApproved) async {
    await _db.collection('reports').doc(reportId).update({
      'status': isApproved ? 'verified' : 'rejected',
      'adminDecidedAt': FieldValue.serverTimestamp(),
    });
  }

  // Grup Liderlik Tablosunu Getir
  Stream<List<Map<String, dynamic>>> watchGroupLeaderboard() {
    return _db.collection('groups')
        .orderBy('progressValue', descending: true)
        .limit(10)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
  }

  // ── OTONOM CİHAZ YÖNETİMİ ──────────────────────────────────────────────────

  // Otonom cihazları dinle
  Stream<List<AutonomousDevice>> watchAutonomousDevices() {
    return _db.collection('autonomous_devices')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => AutonomousDevice.fromMap(doc.id, doc.data()))
            .toList());
  }

  // Belirli bir otonom cihazı dinle
  Stream<AutonomousDevice> watchAutonomousDevice(String deviceId) {
    return _db.collection('autonomous_devices')
        .doc(deviceId)
        .snapshots()
        .map((doc) => AutonomousDevice.fromMap(doc.id, doc.data() ?? {}));
  }

  // Otonom cihaza atık yüklemesi yapıldığında (Simülasyon / Offline-online uyumlu)
  Future<void> recordRecycleTransaction({
    required String userId,
    required String deviceId,
    required double plastic,
    required double glass,
    required double paper,
    required double metal,
    required double organic,
    required double userLat,
    required double userLon,
  }) async {
    // 1. Lokasyon kontrolü: Cihaz konumu ile kullanıcı konumu karşılaştırılır.
    final deviceSnap = await _db.collection('autonomous_devices').doc(deviceId).get();
    if (!deviceSnap.exists) throw Exception('Cihaz bulunamadı.');
    
    final deviceData = deviceSnap.data()!;
    final deviceLoc = deviceData['location'] as Map<String, dynamic>? ?? {};
    final deviceLat = (deviceLoc['latitude'] ?? deviceLoc['lat'] ?? 0.0).toDouble();
    final deviceLon = (deviceLoc['longitude'] ?? deviceLoc['lng'] ?? 0.0).toDouble();

    // Haversine formülü ile mesafe hesaplama (Metre cinsinden)
    final dLat = (deviceLat - userLat) * pi / 180;
    final dLon = (deviceLon - userLon) * pi / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(userLat * pi / 180) * cos(deviceLat * pi / 180) *
        sin(dLon / 2) * sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    final distanceInMeters = 6371000 * c; // Dünya yarıçapı metre

    // 50 Metre Güvenlik Çemberi Kontrolü (Hile Algılama)
    if (distanceInMeters > 50.0) {
      // Cezalandır: Güven skorunu 15 puan düşür
      await _db.collection('users').doc(userId).update({
        'trust_score': FieldValue.increment(-15),
      });
      throw Exception('SPOOFING_DETECTED: Otonom cihaza çok uzaksınız (${distanceInMeters.toStringAsFixed(1)}m). Güven skorunuz düşürüldü!');
    }

    // 2. Cihaz doluluk oranlarını güncelle (Simüle et)
    final Map<String, dynamic> updates = {};
    final currentFillRates = deviceData['fill_rates'] as Map<dynamic, dynamic>? ?? {};
    
    if (plastic > 0) {
      final currentPlast = (currentFillRates['plastic'] ?? 0.0).toDouble();
      updates['fill_rates.plastic'] = (currentPlast + plastic * 2.0).clamp(0.0, 100.0);
    }
    if (glass > 0) {
      final currentGlass = (currentFillRates['glass'] ?? 0.0).toDouble();
      updates['fill_rates.glass'] = (currentGlass + glass * 1.5).clamp(0.0, 100.0);
    }
    if (paper > 0) {
      final currentPaper = (currentFillRates['paper'] ?? 0.0).toDouble();
      updates['fill_rates.paper'] = (currentPaper + paper * 2.5).clamp(0.0, 100.0);
    }
    if (metal > 0) {
      final currentMetal = (currentFillRates['metal'] ?? 0.0).toDouble();
      updates['fill_rates.metal'] = (currentMetal + metal * 1.2).clamp(0.0, 100.0);
    }
    updates['last_serviced'] = FieldValue.serverTimestamp();

    // Cihaz durumunu güncelle
    await _db.collection('autonomous_devices').doc(deviceId).update(updates);

    // 3. Puan hesapla ve kullanıcıya ekle (+%10 Otonom Cihaz Bonusu dahil)
    final double baseScore = AdvancedScoringAlgorithm.calculateWasteScore(
      plastic: plastic,
      glass: glass,
      paper: paper,
      metal: metal,
      organic: organic,
    );
    
    final finalScore = baseScore * 1.10; // +10% verified device bonus

    // 4. İşlemi Kaydet
    final txRef = _db.collection('point_transactions').doc();
    await txRef.set({
      'user_id': userId,
      'type': 'earn',
      'source': 'recycled_at_device',
      'reference_id': deviceId,
      'points_amount': finalScore,
      'waste_details': {
        'plastic': plastic,
        'glass': glass,
        'paper': paper,
        'metal': metal,
        'organic': organic,
      },
      'timestamp': FieldValue.serverTimestamp(),
    });

    // Kullanıcı puanını artır
    await _db.collection('users').doc(userId).update({
      'ecoPoints': FieldValue.increment(finalScore),
    });

    // user_scores tablosunu güncelle
    await _updateUserScore(userId, finalScore, true);
  }

  // ── ECO-MARKET SİSTEMİ ─────────────────────────────────────────────────────

  // Aktif ödül kataloğunu dinle
  Stream<List<RewardItem>> watchRewardsCatalog() {
    return _db.collection('rewards_catalog')
        .where('is_active', isEqualTo: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => RewardItem.fromMap(doc.id, doc.data()))
            .toList());
  }

  // Kullanıcının puan geçmişini dinle
  Stream<List<PointTransaction>> watchUserTransactions(String userId) {
    return _db.collection('point_transactions')
        .where('user_id', isEqualTo: userId)
        .snapshots()
        .map((snapshot) {
          final docs = snapshot.docs;
          final list = docs.map((doc) => PointTransaction.fromMap(doc.id, doc.data())).toList();
          list.sort((a, b) => b.timestamp.compareTo(a.timestamp)); // Yeniden eskiye sıralama
          return list;
        });
  }

  // Ödül satın al / Puan harca
  Future<void> redeemReward({
    required String userId,
    required String rewardId,
    required int pointsCost,
    required Map<String, dynamic> shippingAddress,
  }) async {
    final userRef = _db.collection('users').doc(userId);
    final rewardRef = _db.collection('rewards_catalog').doc(rewardId);

    await _db.runTransaction((transaction) async {
      final userSnap = await transaction.get(userRef);
      final rewardSnap = await transaction.get(rewardRef);

      if (!userSnap.exists) throw Exception('Kullanıcı bulunamadı.');
      if (!rewardSnap.exists) throw Exception('Ödül bulunamadı.');

      final userData = userSnap.data()!;
      final rewardData = rewardSnap.data()!;

      final userPoints = (userData['ecoPoints'] ?? 0.0).toDouble();
      final stock = (rewardData['stock'] ?? 0).toInt();

      if (userPoints < pointsCost) {
        throw Exception('Yetersiz bakiye! Bu ödül için ${pointsCost} Eco-Puan gerekiyor, mevcut bakiyeniz: ${userPoints.toStringAsFixed(1)}');
      }

      if (stock <= 0) {
        throw Exception('Üzgünüz, bu ürünün stoğu tükenmiştir.');
      }

      // Stok azalt, kullanıcı puanını düşür
      transaction.update(rewardRef, {'stock': stock - 1});
      transaction.update(userRef, {'ecoPoints': userPoints - pointsCost});

      // Puan geçmişini kaydet
      final txRef = _db.collection('point_transactions').doc();
      transaction.set(txRef, {
        'user_id': userId,
        'type': 'spend',
        'source': 'spend_reward',
        'reference_id': rewardId,
        'points_amount': -pointsCost.toDouble(),
        'timestamp': FieldValue.serverTimestamp(),
      });

      // Ödül talebini kaydet
      final redemptionRef = _db.collection('reward_redemptions').doc();
      final randomCode = 'TD-REDEEM-${Random().nextInt(90000) + 10000}';
      transaction.set(redemptionRef, {
        'user_id': userId,
        'reward_id': rewardId,
        'points_spent': pointsCost,
        'status': 'pending',
        'redemption_code': randomCode,
        'shipping_address': shippingAddress,
        'created_at': FieldValue.serverTimestamp(),
      });
    });
  }

  // ── YENİ RAPORLAMA VE YORUMLAMA SERVİSLERİ ──────────────────────────────

  // Firebase Storage'a çoklu fotoğraf yükleme metodu
  Future<List<String>> uploadReportImages(String reportId, List<Uint8List> imagesBytes) async {
    List<String> imageUrls = [];
    try {
      final storageRef = FirebaseStorage.instance.ref().child('reports/$reportId');
      for (int i = 0; i < imagesBytes.length; i++) {
        final imageRef = storageRef.child('image_$i.jpg');
        final uploadTask = imageRef.putData(imagesBytes[i]);
        final snapshot = await uploadTask;
        final url = await snapshot.ref.getDownloadURL();
        imageUrls.add(url);
      }
    } catch (e) {
      print('Firebase Storage upload error: $e');
    }
    return imageUrls;
  }

  // Yeni şema ile rapor kaydetme metodu (Storage yüklemesi ile)
  Future<void> submitReportWithImages({
    required String userId,
    required double latitude,
    required double longitude,
    required String description,
    required List<Uint8List> imagesBytes,
    String areaSize = 'small',
  }) async {
    // Rapor için önceden benzersiz bir ID oluşturup bunu Storage yüklemesinde kullanacağız
    final reportDocRef = _db.collection('reports').doc();
    final String reportId = reportDocRef.id;

    // Fotoğrafları Firebase Storage'a yükle
    List<String> imageUrls = await uploadReportImages(reportId, imagesBytes);

    // Raporu Firestore'a kaydet
    await reportDocRef.set({
      'reportId': reportId,
      'userId': userId,
      'latitude': latitude,
      'longitude': longitude,
      'description': description,
      'images': imageUrls,
      'timestamp': FieldValue.serverTimestamp(),
      'status': 'dirty',
      'currentGroupId': null,
      'areaSize': areaSize,
    });
  }

  // Belirli bir rapora yorum ekleme metodu
  Future<void> submitComment({
    required String reportId,
    required String userId,
    required String userName,
    required String commentText,
  }) async {
    final commentDocRef = _db.collection('reports').doc(reportId).collection('comments').doc();
    await commentDocRef.set({
      'commentId': commentDocRef.id,
      'userId': userId,
      'userName': userName,
      'commentText': commentText,
      'timestamp': FieldValue.serverTimestamp(),
    });
  }

  // Belirli bir raporun yorumlarını canlı izleme akışı
  Stream<List<Map<String, dynamic>>> watchComments(String reportId) {
    return _db.collection('reports').doc(reportId).collection('comments')
        .orderBy('timestamp', descending: false)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
  }

  // --- Yeni Temizlik İş Akışı ve Hedef Yönetimi Metotları ---

  // Grubun hedefini günceller
  Future<void> updateGroupTarget(String groupId, String? reportId, String targetAreaName) async {
    await _db.collection('groups').doc(groupId).update({
      'targetReportId': reportId,
      'targetArea': targetAreaName,
    });
  }

  // Grup üyesinin hazır olma durumunu değiştirir
  Future<void> toggleMemberReadyStatus(String groupId, String userId, bool isReady) async {
    final groupRef = _db.collection('groups').doc(groupId);
    if (isReady) {
      await groupRef.update({
        'readyMembers': FieldValue.arrayUnion([userId])
      });
    } else {
      await groupRef.update({
        'readyMembers': FieldValue.arrayRemove([userId])
      });
    }
  }

  // Temizliği başlatır. Rapor durumunu 'cleaning' yapar ve kilitler. Grubun durumunu 'cleaning' yapar.
  Future<void> startCleanupOperation(String groupId, String reportId) async {
    final batch = _db.batch();
    
    final groupRef = _db.collection('groups').doc(groupId);
    batch.update(groupRef, {'status': 'cleaning'});
    
    final reportRef = _db.collection('reports').doc(reportId);
    batch.update(reportRef, {
      'status': 'cleaning',
      'currentGroupId': groupId,
    });
    
    await batch.commit();
  }

  // Temizliği iptal eder. Rapor durumunu 'dirty' ve kilit açar. Grubun durumunu 'ready' yapar, hazır üyeleri temizler.
  Future<void> cancelCleanupOperation(String groupId, String reportId) async {
    final batch = _db.batch();
    
    final groupRef = _db.collection('groups').doc(groupId);
    batch.update(groupRef, {
      'status': 'ready',
      'readyMembers': [],
    });
    
    final reportRef = _db.collection('reports').doc(reportId);
    batch.update(reportRef, {
      'status': 'dirty',
      'currentGroupId': null,
    });
    
    await batch.commit();
  }

  // Gruba katılma isteği gönderir
  Future<void> sendGroupJoinRequest(String groupId, String userId, String userName) async {
    final requestRef = _db.collection('group_join_requests').doc('${groupId}_$userId');
    await requestRef.set({
      'groupId': groupId,
      'userId': userId,
      'userName': userName,
      'status': 'pending',
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  // Katılma isteğini kabul et
  Future<void> acceptGroupJoinRequest(String requestId, String groupId, String userId) async {
    await _db.runTransaction((transaction) async {
      transaction.update(_db.collection('group_join_requests').doc(requestId), {'status': 'accepted'});
      transaction.update(_db.collection('groups').doc(groupId), {
        'members': FieldValue.arrayUnion([userId])
      });
    });
  }

  // Gruba gelen katılma isteklerini izler
  Stream<List<Map<String, dynamic>>> watchGroupJoinRequests(String groupId) {
    return _db.collection('group_join_requests')
        .where('groupId', isEqualTo: groupId)
        .where('status', isEqualTo: 'pending')
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
  }
}