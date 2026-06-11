const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Matematiksel mesafe hesaplama (GPS Spoofing kontrolü için)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Dünyanın yarıçapı km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

/**
 * Yeni bir bildirim (report) oluşturulduğunda tetiklenen ana motor.
 * 1. Fraud / Sahtekarlık Analizi
 * 2. AI Kirlilik Skoru Analizi
 * 3. Güven Skoru (Trust Score) Güncellemesi
 */
exports.processNewReport = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap, context) => {
    const reportData = snap.data();
    const reporterId = reportData.reporter_id;
    const reportId = context.params.reportId;

    let finalStatus = 'pending_review';
    let trustScoreModifier = 0;

    // KULLANICI BİLGİSİNİ GETİR
    const userRef = db.collection('users').doc(reporterId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return null;
    const userData = userDoc.data();

    // 1. FRAUD (SAHTEKARLIK) KONTROLÜ
    // İstemciden gelen Exif zamanı ile sunucu zamanı uyuşmazlığı (Örn: Eski fotoğraf)
    const timeDiff = Math.abs(Date.now() - reportData.exif_timestamp);
    if (timeDiff > 1000 * 60 * 60) { // 1 saatten eski fotoğraf
      return snap.ref.update({
        status: 'rejected',
        rejection_reason: 'Fotoğraf çok eski (Galeri yüklemesi şüphesi).'
      });
    }

    // GPS Spoofing Kontrolü: İstemci konumu ile fotoğraftaki exif konumu arasındaki fark
    const distance = getDistanceFromLatLonInKm(
      reportData.device_location.latitude,
      reportData.device_location.longitude,
      reportData.exif_location.latitude,
      reportData.exif_location.longitude
    );

    if (distance > 0.5) { // 500 metreden fazla fark var
      // Güven skorunu ağır cezalandır (GPS Spoofing)
      await userRef.update({ trust_score: admin.firestore.FieldValue.increment(-15) });
      return snap.ref.update({
        status: 'rejected',
        rejection_reason: 'Fiziksel konum ile fotoğraf konumu uyuşmuyor (GPS Spoofing).'
      });
    }

    // 2. AI MOTORU ENTEGRASYON MANTIĞI
    const aiScore = reportData.ai_confidence_score; // 0.0 ile 1.0 arası bir değer
    
    // Eğer kullanıcı moderatör ise (Trust Score >= 90), AI skoru ne olursa olsun hızlı onaydan geçer 
    // (veya moderatörler için %50 barajı konulabilir)
    const isModerator = userData.trust_score >= 90;

    if (aiScore >= 0.70 || (isModerator && aiScore >= 0.50)) {
      finalStatus = 'verified';
      trustScoreModifier = 5; // Başarılı doğrulama puan kazandırır
    } else if (aiScore <= 0.20) {
      finalStatus = 'rejected';
      trustScoreModifier = -10; // Kasıtlı yanıltıcı görsel cezası
      // Not: Moderatör bile olsa %20 altı kabul edilmez
    } else {
      // Ara değer: %21 - %69. İnsan (Moderatör) onayı gerekir.
      finalStatus = 'pending_review';
    }

    // 3. VERİTABANI GÜNCELLEMELERİ
    const batch = db.batch();
    
    // Rapor durumunu güncelle
    batch.update(snap.ref, {
      status: finalStatus,
      processed_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Kullanıcı Güven Skorunu ve istatistiklerini güncelle
    if (trustScoreModifier !== 0) {
      const newTrustScore = Math.max(0, Math.min(100, userData.trust_score + trustScoreModifier));
      
      batch.update(userRef, {
        trust_score: newTrustScore,
        total_reports: admin.firestore.FieldValue.increment(1),
        verified_reports: finalStatus === 'verified' ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0)
      });
      
      // Moderatör yetkisi kontrolü (Custom Claim ile de yapılabilir)
      if (newTrustScore >= 90 && userData.trust_score < 90) {
        // Kullanıcı yeni moderatör oldu, custom claim eklenebilir.
        await admin.auth().setCustomUserClaims(reporterId, { moderator: true });
      } else if (newTrustScore < 90 && userData.trust_score >= 90) {
        // Güven skoru düştüğü için moderatörlük iptali
        await admin.auth().setCustomUserClaims(reporterId, { moderator: false });
      }
    }

    await batch.commit();
    return null;
  });

/**
 * Moderatör manuel onayı
 */
exports.moderatorReview = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.moderator) {
    throw new functions.https.HttpsError('permission-denied', 'Bu işlem için moderatör yetkisi gereklidir.');
  }

  const { reportId, decision } = data; // decision: 'approve' or 'reject'
  const reportRef = db.collection('reports').doc(reportId);
  const reportSnap = await reportRef.get();
  
  if (!reportSnap.exists || reportSnap.data().status !== 'pending_review') {
    throw new functions.https.HttpsError('failed-precondition', 'Geçersiz rapor durumu.');
  }

  const reporterId = reportSnap.data().reporter_id;
  const isApproved = decision === 'approve';
  
  const batch = db.batch();
  batch.update(reportRef, { 
    status: isApproved ? 'verified' : 'rejected',
    reviewed_by: context.auth.uid,
    reviewed_at: admin.firestore.FieldValue.serverTimestamp()
  });

  const trustModifier = isApproved ? 2 : -5; // Manuel onayda daha hafif puan değişimi
  batch.update(db.collection('users').doc(reporterId), {
    trust_score: admin.firestore.FieldValue.increment(trustModifier)
  });

  await batch.commit();
  return { success: true };
});

/**
 * Otonom Cihaz Atık İşlemi Doğrulama ve Güvenlik Motoru
 */
exports.verifyRecycleTransaction = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Bu işlem için giriş yapılması gereklidir.');
  }

  const userId = context.auth.uid;
  const { deviceId, userLat, userLon, wasteDetails } = data;

  if (!deviceId || userLat === undefined || userLon === undefined || !wasteDetails) {
    throw new functions.https.HttpsError('invalid-argument', 'Eksik parametre gönderildi.');
  }

  const deviceRef = db.collection('autonomous_devices').doc(deviceId);
  const deviceSnap = await deviceRef.get();

  if (!deviceSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Belirtilen otonom cihaz bulunamadı.');
  }

  const deviceData = deviceSnap.data();
  const deviceLoc = deviceData.location || {};
  const deviceLat = Number(deviceLoc.latitude || deviceLoc.lat || 0);
  const deviceLon = Number(deviceLoc.longitude || deviceLoc.lng || 0);

  // Haversine ile mesafe hesaplama (km)
  const distance = getDistanceFromLatLonInKm(userLat, userLon, deviceLat, deviceLon);

  // 50 Metre Güvenlik Çemberi Kontrolü (50m = 0.05 km)
  if (distance > 0.05) {
    // Cezalandır: Güven skorunu 15 puan düşür
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      const currentTrust = userSnap.data().trust_score || 50;
      const newTrust = Math.max(0, currentTrust - 15);
      await userRef.update({ trust_score: newTrust });
    }
    throw new functions.https.HttpsError(
      'permission-denied',
      `UNAUTHORIZED_SPOOFING_DETECTED: Otonom cihaza çok uzaksınız (${(distance * 1000).toFixed(1)}m). Güven skorunuz düşürüldü!`
    );
  }

  // Son 3 dakika içinde bir aktif sensör güncellemesi / veri artışı kontrolü
  const lastServiced = deviceData.last_serviced ? deviceData.last_serviced.toDate() : null;
  if (lastServiced) {
    const timeDiffMin = (Date.now() - lastServiced.getTime()) / (1000 * 60);
    if (timeDiffMin > 3.0) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Cihazdan son 3 dakika içinde aktif atık alım verisi alınamadı. Lütfen cihazın atık alım işlemini tamamlamasını bekleyin.'
      );
    }
  }

  // Puan hesaplama
  const plastic = Number(wasteDetails.plastic || 0);
  const glass = Number(wasteDetails.glass || 0);
  const paper = Number(wasteDetails.paper || 0);
  const metal = Number(wasteDetails.metal || 0);
  const organic = Number(wasteDetails.organic || 0);

  // Katsayılar: Plastik: 1.5, Cam: 1.2, Kağıt: 1.0, Metal: 1.8, Organik: 1.3
  const baseScore = (plastic * 1.5) + (glass * 1.2) + (paper * 1.0) + (metal * 1.8) + (organic * 1.3);
  // Cihaz bonusu: +10%
  const finalScore = baseScore * 1.10;

  // Veritabanı güncellemesi
  const batch = db.batch();

  // 1. Cihaz doluluk oranlarını güncelle
  const fillRates = deviceData.fill_rates || {};
  const newFillRates = {
    plastic: Math.min(100.0, (fillRates.plastic || 0) + plastic * 2.0),
    glass: Math.min(100.0, (fillRates.glass || 0) + glass * 1.5),
    paper: Math.min(100.0, (fillRates.paper || 0) + paper * 2.5),
    metal: Math.min(100.0, (fillRates.metal || 0) + metal * 1.2),
  };
  batch.update(deviceRef, {
    fill_rates: newFillRates,
    last_serviced: admin.firestore.FieldValue.serverTimestamp()
  });

  // 2. Kullanıcı puanını güncelle
  const userRef = db.collection('users').doc(userId);
  batch.update(userRef, {
    ecoPoints: admin.firestore.FieldValue.increment(finalScore)
  });

  // 3. Puan işlemini kaydet
  const txRef = db.collection('point_transactions').doc();
  batch.set(txRef, {
    user_id: userId,
    type: 'earn',
    source: 'recycled_at_device',
    reference_id: deviceId,
    points_amount: finalScore,
    waste_details: { plastic, glass, paper, metal, organic },
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  // 4. user_scores güncelle
  const userScoreRef = db.collection('user_scores').doc(userId);
  batch.set(userScoreRef, {
    userId: userId,
    ecoPoints: admin.firestore.FieldValue.increment(finalScore),
    totalScore: admin.firestore.FieldValue.increment(finalScore),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await batch.commit();

  return {
    success: true,
    earnedPoints: finalScore
  };
});
