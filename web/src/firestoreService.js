import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc, orderBy, limit, startAfter, getDocs, increment, setDoc, getDoc } from 'firebase/firestore'
import { AdvancedScoringAlgorithm } from './scoringAlgorithm'

/**
 * 📄 PAGINATION - Reports with cursor-based pagination
 * @param {*} db - Firestore instance
 * @param {*} callback - Callback function
 * @param {number} pageSize - Items per page (default: 10)
 * @param {*} lastVisible - Last document for cursor pagination
 * @returns {Function} Unsubscribe function
 */
export function watchIncomingReportsWithPagination(db, callback, pageSize = 10, lastVisible = null) {
  // Compat: allow (callback, pageSize, lastVisible?) invocation
  if (typeof db === 'function') {
    lastVisible = typeof callback === 'object' ? callback : null
    pageSize = typeof callback === 'number' ? callback : (typeof pageSize === 'number' ? pageSize : 10)
    callback = db
    db = window.firestore
  }
  const fetchSize = pageSize + 1 // fetch one extra to detect hasMore
  try {
    let q

    if (lastVisible) {
      q = query(
        collection(db, 'reports'),
        where('status', 'in', ['open', 'in_progress']),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(fetchSize)
      )
    } else {
      q = query(
        collection(db, 'reports'),
        where('status', 'in', ['open', 'in_progress']),
        orderBy('createdAt', 'desc'),
        limit(fetchSize)
      )
    }

    return onSnapshot(q, snap => {
      const allDocs = snap.docs
      const hasMore = allDocs.length > pageSize
      const pageDocs = hasMore ? allDocs.slice(0, pageSize) : allDocs
      const docs = pageDocs.map(d => ({ id: d.id, ...d.data() }))
      const lastDoc = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null
      callback({
        data: docs,
        reports: docs,
        lastVisible: lastDoc,
        hasMore,
      })
    })
  } catch (e) {
    console.error('watchIncomingReportsWithPagination error', e)
    return () => {}
  }
}

/**
 * 📄 PAGINATION - Groups with cursor-based pagination
 */
export function watchGroupsWithPagination(db, callback, pageSize = 10, lastVisible = null) {
  if (typeof db === 'function') {
    lastVisible = pageSize;
    pageSize = callback ?? 10;
    callback = db;
    db = window.firestore;
  }
  try {
    let q;
    
    if (lastVisible) {
      q = query(
        collection(db, 'groups'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(pageSize)
      );
    } else {
      q = query(
        collection(db, 'groups'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    }
    
    return onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      callback({
        data: docs,
        groups: docs,
        lastVisible: lastDoc,
        pageSize: pageSize,
        hasMore: docs.length === pageSize
      });
    });
  } catch (e) {
    console.error('watchGroupsWithPagination error', e);
    return () => {};
  }
}

/**
 * 📄 PAGINATION - Verifications with cursor-based pagination
 */
export function watchVerificationPendingWithPagination(db, callback, pageSize = 5, lastVisible = null) {
  if (typeof db === 'function') {
    lastVisible = pageSize;
    pageSize = callback ?? 5;
    callback = db;
    db = window.firestore;
  }
  try {
    let q;
    
    if (lastVisible) {
      q = query(
        collection(db, 'photo_verifications'),
        where('status', '==', 'manual_review'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(pageSize)
      );
    } else {
      q = query(
        collection(db, 'photo_verifications'),
        where('status', '==', 'manual_review'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    }
    
    return onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      callback({
        data: docs,
        verifications: docs,
        lastVisible: lastDoc,
        hasMore: docs.length === pageSize
      });
    });
  } catch (e) {
    console.error('watchVerificationPendingWithPagination error', e);
    return () => {};
  }
}

/**
 * 📄 ONE-TIME FETCH - Get count of items
 */
export async function getCollectionCount(db, collectionName, whereCondition = null) {
  // Compat: allow (collectionName) invocation using window.firestore
  if (typeof db === 'string') {
    whereCondition = collectionName ?? null
    collectionName = db
    db = window.firestore
  }
  let q
  if (whereCondition) {
    q = query(collection(db, collectionName), whereCondition)
  } else {
    q = query(collection(db, collectionName))
  }
  const snap = await getDocs(q) // will throw — callers should handle errors
  return snap.docs.length
}

export function watchIncomingReports(db, callback){
  try{
    const q = query(collection(db, 'reports'), where('status', 'in', ['open', 'in_progress']))
    return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }catch(e){
    console.error('watchIncomingReports error', e)
    return () => {}
  }
}

export function watchVerificationPending(db, callback){
  try{
    const q = query(collection(db, 'photo_verifications'), where('status', '==', 'manual_review'))
    return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }catch(e){
    console.error('watchVerificationPending error', e)
    return () => {}
  }
}

export function watchLiveOperations(db, callback){
  try{
    const q = query(collection(db, 'live_operations'), where('status', 'in', ['active', 'paused']))
    return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }catch(e){
    console.error('watchLiveOperations error', e)
    return () => {}
  }
}

export function watchPendingUsers(db, callback){
  try{
    const q = query(collection(db, 'users'), where('verified', '==', false))
    return onSnapshot(q, snap => callback(snap.docs.map(d=>({ id:d.id, ...d.data() }))))
  }catch(e){ console.error('watchPendingUsers error', e); return ()=>{} }
}

export async function verifyUser(db, userId){
  try{
    const d = doc(db, 'users', userId)
    await updateDoc(d, { verified: true, verifiedAt: serverTimestamp() })
  }catch(e){ console.error('verifyUser error', e); throw e }
}

export async function approveVerification(db, id, reviewer){
  try{
    const d = doc(db, 'photo_verifications', id)
    await updateDoc(d, { status: 'approved', reviewedBy: reviewer || 'dashboard', reviewedAt: serverTimestamp() })
  }catch(e){ console.error('approveVerification error', e) }
}

export async function rejectVerification(db, id, reviewer, reason){
  try{
    const d = doc(db, 'photo_verifications', id)
    await updateDoc(d, { status: 'rejected', reviewedBy: reviewer || 'dashboard', reviewedAt: serverTimestamp(), rejectReason: reason || '' })
  }catch(e){ console.error('rejectVerification error', e) }
}

export async function sendNotification(db, payload){
  try{
    const c = collection(db, 'notifications')
    await addDoc(c, { ...payload, createdAt: serverTimestamp() })
  }catch(e){ console.error('sendNotification error', e) }
}

export async function saveCleanupResult(db, payload){
  try{
    const c = collection(db, 'cleanup_sessions')
    await addDoc(c, { ...payload, createdAt: serverTimestamp() })
  }catch(e){ console.error('saveCleanupResult error', e) }
}

/**
 * 📊 Gelişmiş Scoring ile Cleanup Puanını Hesapla ve Güncelle
 */
export async function calculateAndUpdateCleanupScore(db, {
  userId,
  groupId,
  weight,
  difficulty,
  urgency,
  membersCount,
  completionPercentage,
  isPhotoVerified,
  hoursSpent,
}) {
  try {
    // Advanced scoring'i hesapla
    const score = AdvancedScoringAlgorithm.calculateTotalScore({
      weight,
      difficulty,
      urgency,
      membersCount,
      completionPercentage,
      isVerified: isPhotoVerified,
      hoursSpent,
    })

    // Score breakdown'ı al
    const breakdown = AdvancedScoringAlgorithm.getScoreBreakdown({
      weight,
      difficulty,
      urgency,
      membersCount,
      completionPercentage,
      isVerified: isPhotoVerified,
      hoursSpent,
    })

    // Cleanup session'ı kaydet
    const sessionRef = await addDoc(collection(db, 'cleanup_sessions'), {
      userId,
      groupId,
      weight,
      difficulty,
      urgency,
      membersCount,
      completionPercentage,
      photoVerified: isPhotoVerified,
      durationHours: hoursSpent,
      earnedPoints: score,
      scoreBreakdown: breakdown,
      createdAt: serverTimestamp(),
    })

    // Kullanıcı documento'ı güncelle
    const userDocRef = doc(db, 'users', userId)
    await updateDoc(userDocRef, {
      ecoPoints: increment(score),
      cleanupCount: increment(1),
      lastCleanupAt: serverTimestamp(),
    })

    // user_scores collection'ını güncelle
    await updateUserScore(db, userId, score, isPhotoVerified)

    // Başarıları kontrol et
    await checkAndAwardAchievements(db, userId)

    return {
      sessionId: sessionRef.id,
      score,
      breakdown,
    }
  } catch (error) {
    console.error('calculateAndUpdateCleanupScore error:', error)
    throw error
  }
}

/**
 * 📊 User Score Document'ını Güncelle
 */
async function updateUserScore(db, userId, score, verified) {
  try {
    const userScoreRef = doc(db, 'user_scores', userId)
    const snapshot = await getDocs(collection(db, 'user_scores'), query(where('userId', '==', userId)))

    if (!snapshot.empty) {
      const currentData = snapshot.docs[0].data()
      const currentTotal = (currentData.totalScore ?? 0)
      const newTotal = currentTotal + score

      await updateDoc(userScoreRef, {
        totalScore: newTotal,
        ecoPoints: increment(score),
        cleanupCount: increment(1),
        verifiedPhotosCount: verified ? increment(1) : increment(0),
        lastUpdated: serverTimestamp(),
        badge: AdvancedScoringAlgorithm.determineBadge(newTotal),
        level: AdvancedScoringAlgorithm.determineLevel(newTotal),
      })
    } else {
      // Yeni user_scores dokümanı oluştur
      await setDoc(userScoreRef, {
        userId,
        totalScore: score,
        ecoPoints: score,
        cleanupCount: 1,
        verifiedPhotosCount: verified ? 1 : 0,
        consecutiveDays: 0,
        maxDifficulty: 0,
        averageEfficiency: 0,
        achievements: verified ? ['photo_verified'] : [],
        badge: AdvancedScoringAlgorithm.determineBadge(score),
        level: AdvancedScoringAlgorithm.determineLevel(score),
        lastUpdated: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error('updateUserScore error:', error)
  }
}

/**
 * 🎖️ Başarıları Kontrol Et ve Say
 */
async function checkAndAwardAchievements(db, userId) {
  try {
    const userScoreRef = doc(db, 'user_scores', userId)
    const snapshot = await getDocs(collection(db, 'user_scores'), query(where('userId', '==', userId)))

    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data()

      const totalCleanups = userData.cleanupCount ?? 0
      const verifiedPhotos = userData.verifiedPhotosCount ?? 0
      const consecutiveDays = userData.consecutiveDays ?? 0
      const maxDifficulty = userData.maxDifficulty ?? 0

      const achievements = AdvancedScoringAlgorithm.checkAchievements({
        totalCleanups,
        verifiedPhotos,
        averageEfficiency: userData.averageEfficiency ?? 0,
        consecutiveDays,
        maxDifficulty,
      })

      if (achievements.length > 0) {
        const currentAchievements = userData.achievements ?? []
        const newAchievements = achievements.filter(a => !currentAchievements.includes(a))

        if (newAchievements.length > 0) {
          await updateDoc(userScoreRef, {
            achievements: [...currentAchievements, ...newAchievements],
          })
        }
      }
    }
  } catch (error) {
    console.error('checkAndAwardAchievements error:', error)
  }
}

/**
 * 🏆 Real-time Leaderboard - User Scores'dan sıralamayı İzle
 */
export function watchLeaderboard(db, callback, limit_count = 50) {
  try {
    const q = query(
      collection(db, 'user_scores'),
      orderBy('totalScore', 'desc'),
      limit(limit_count)
    )

    return onSnapshot(q, snap => {
      const leaderboardData = snap.docs.map((d, idx) => ({
        rank: idx + 1,
        id: d.id,
        userId: d.data().userId,
        userName: d.data().userName || 'Kullanıcı',
        ecoPoints: d.data().totalScore || 0,
        totalScore: d.data().totalScore || 0,
        cleanupCount: d.data().cleanupCount || 0,
        badge: d.data().badge || 'bronze',
        level: d.data().level || 'novice',
        achievements: d.data().achievements || [],
        verifiedPhotosCount: d.data().verifiedPhotosCount || 0,
        avatar: d.data().avatar,
      }))

      callback(leaderboardData)
    })
  } catch (error) {
    console.error('watchLeaderboard error:', error)
    return () => {} // Unsubscribe function
  }
}

/**
 * 🏆 Leaderboard'u Periyoda Göre İzle
 */
export function watchLeaderboardByPeriod(db, callback, period = 'all', limit_count = 50) {
  try {
    let filterQuery = query(
      collection(db, 'cleanup_sessions'),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(filterQuery, snap => {
      const now = new Date()
      let filteredDocs = snap.docs

      // Zaman filtresini uygula
      if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filteredDocs = filteredDocs.filter(d => {
          const docDate = d.data().createdAt?.toDate?.() || new Date()
          return docDate >= weekAgo
        })
      } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        filteredDocs = filteredDocs.filter(d => {
          const docDate = d.data().createdAt?.toDate?.() || new Date()
          return docDate >= monthAgo
        })
      }

      // Kullanıcıya göre topla
      const userScores = {}
      filteredDocs.forEach(d => {
        const userId = d.data().userId
        const score = d.data().earnedPoints || 0
        userScores[userId] = (userScores[userId] || 0) + score
      })

      // Sırala ve döndür
      const leaderboardData = Object.entries(userScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit_count)
        .map((entry, idx) => ({
          rank: idx + 1,
          userId: entry[0],
          totalScore: entry[1],
          ecoPoints: entry[1],
        }))

      callback(leaderboardData)
    })
  } catch (error) {
    console.error('watchLeaderboardByPeriod error:', error)
    return () => {}
  }
}

/**
 * ⚙️ Admin Config - Scoring ayarlarını al
 */
export async function getAdminConfig(db) {
  try {
    const docRef = doc(db, 'admin_config', 'scoring')
    const snap = await getDoc(docRef)
    
    if (snap.exists()) {
      return snap.data()
    }
    return null
  } catch (error) {
    console.error('getAdminConfig error:', error)
    throw error
  }
}

/**
 * ⚙️ Admin Config - Scoring ayarlarını güncelle
 */
export async function updateAdminConfig(db, config) {
  try {
    const docRef = doc(db, 'admin_config', 'scoring')
    
    // Değişiklikleri kaydet
    const changesSummary = JSON.stringify(config, null, 2)
    
    await setDoc(docRef, {
      ...config,
      lastUpdated: serverTimestamp(),
      updatedBy: 'admin', // Gerçek uygulamada auth user'dan gelir
    })
    
    // Geçmişe ekle
    await addDoc(collection(db, 'admin_config', 'scoring', 'history'), {
      timestamp: serverTimestamp(),
      changedBy: 'admin', // Gerçek uygulamada auth user'dan gelir
      changes: changesSummary,
      config: config,
    })
    
    return true
  } catch (error) {
    console.error('updateAdminConfig error:', error)
    throw error
  }
}

/**
 * ⚙️ Admin Config - Geçmiş kayıtlarını al
 */
export async function getConfigHistory(db) {
  try {
    const q = query(
      collection(db, 'admin_config_history'),
      orderBy('timestamp', 'desc'),
      limit(50)
    )
    
    const snap = await getDocs(q)
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.() || new Date(),
    }))
  } catch (error) {
    console.error('getConfigHistory error:', error)
    return []
  }
}

/**
 * ⚙️ Admin Config - Varsayılana sıfırla
 */
export async function resetConfigToDefaults(db) {
  try {
    const defaultConfig = {
      scoreFactors: {
        WEIGHT: 0.30,
        DIFFICULTY: 0.20,
        URGENCY: 0.15,
        EFFICIENCY: 0.20,
        VERIFICATION: 0.10,
        TIME: 0.05,
      },
      bonusMultipliers: {
        leaderboardTop10: 1.20,
        leaderboardTop50: 1.10,
        leaderboardTop100: 1.05,
        streakMultiplier: 1.02,
        teamEfficiencyBonus: {
          solo: 1.0,
          small: 1.10,
          medium: 1.20,
          large: 1.30,
        },
      },
      achievements: {
        firstCleanup: 10,
        tenCleanups: 50,
        fiftyCleanups: 100,
        hundredCleanups: 200,
        teamLeader: 150,
        photoVerified: 25,
        efficiencyMaster: 75,
        consistencyWeek: 30,
        consistencyMonth: 60,
        highDifficulty: 50,
      },
      badgeThresholds: {
        bronze: 0,
        silver: 500,
        gold: 1000,
        platinum: 2000,
      },
      levelThresholds: {
        novice: 0,
        beginner: 100,
        intermediate: 500,
        pro: 1000,
        expert: 2000,
        master: 5000,
      },
      isDefault: true,
    }
    
    await updateAdminConfig(db, defaultConfig)
    return true
  } catch (error) {
    console.error('resetConfigToDefaults error:', error)
    throw error
  }
}

export async function createUserDocument(uid, data) {
  let db = window.firestore;
  if (typeof uid !== 'string') {
    db = uid;
    uid = data.uid || data;
    data = arguments[2];
  }
  if (!uid) throw new Error('UID is required');
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, data);
}

export async function getUserDocument(uid) {
  let db = window.firestore;
  if (typeof uid !== 'string') {
    db = uid;
    uid = arguments[1];
  }
  if (!uid) return null;
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

export async function createReport(data) {
  let db = window.firestore;
  if (data && data.firestore) {
    db = data;
    data = arguments[1];
  }
  if (!data || !data.title || data.title.trim() === '') {
    throw new Error('Başlık gereklidir');
  }
  if (typeof data.title !== 'string') {
    throw new Error('Başlık string olmalıdır');
  }
  if (data.weight !== undefined && typeof data.weight !== 'number') {
    throw new Error('Ağırlık sayı olmalıdır');
  }
  const cleanData = {
    ...data,
    title: data.title.trim(),
    createdAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, 'reports'), cleanData);
  return { id: ref.id };
}

export async function updateGroupMembers(groupId, members) {
  let db = window.firestore;
  if (typeof groupId !== 'string') {
    db = groupId;
    groupId = members;
    members = arguments[2];
  }
  if (!groupId) throw new Error('Group ID is required');
  if (!members || members.length === 0) {
    throw new Error('Üye listesi boş olamaz');
  }
  const docRef = doc(db, 'groups', groupId);
  await updateDoc(docRef, { members, updatedAt: serverTimestamp() });
}

/**
 * 👥 watchAllUsers - Admin function to listen to all users
 */
export function watchAllUsers(db, callback) {
  if (typeof db === 'function') {
    callback = db;
    db = window.firestore;
  }
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  } catch (e) {
    console.error('watchAllUsers error', e);
    return () => {};
  }
}

/**
 * 🧹 watchUserCleanups - Listen to cleanup sessions for a specific user
 */
export function watchUserCleanups(db, userId, callback) {
  if (typeof db === 'string') {
    callback = arguments[2];
    userId = db;
    db = window.firestore;
  }
  try {
    const q = query(
      collection(db, 'cleanup_sessions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  } catch (e) {
    console.error('watchUserCleanups error', e);
    return () => {};
  }
}

/**
 * 📸 watchUserPhotos - Listen to photo verifications for a specific user
 */
export function watchUserPhotos(db, userId, callback) {
  if (typeof db === 'string') {
    callback = arguments[2];
    userId = db;
    db = window.firestore;
  }
  try {
    const q = query(
      collection(db, 'photo_verifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  } catch (e) {
    console.error('watchUserPhotos error', e);
    return () => {};
  }
}
