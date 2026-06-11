import { collection, doc, addDoc, setDoc, getDoc, query, where, onSnapshot, updateDoc, serverTimestamp, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore'

export async function createGroup(db, groupData){
  try{
    const c = collection(db, 'volunteer_groups')
    const ref = await addDoc(c, { 
      ...groupData, 
      status: 'open', 
      members: groupData.members || [], 
      points: 0, 
      autoApprove: false, // Varsayılan olarak manuel onay
      createdAt: serverTimestamp() 
    })
    return ref.id
  }catch(e){ console.error('createGroup error', e); throw e }
}

export function watchGroups(db, callback){
  try{
    const q = query(collection(db, 'volunteer_groups'))
    return onSnapshot(q, snap => callback(snap.docs.map(d=>({ id: d.id, ...d.data() }))))
  }catch(e){ console.error('watchGroups error', e); return ()=>{} }
}

// Gruba katılma isteği gönder
export async function requestJoinGroup(db, groupId, userId, reason = ''){
  try{
    const c = collection(db, 'join_requests')
    await addDoc(c, {
      groupId,
      userId,
      reason,
      status: 'pending',
      requestedAt: serverTimestamp()
    })
    
    // Grup yöneticisine bildirim gönder (gerçek uygulamada Firebase Cloud Functions ile)
    console.log(`📢 Bildirim: ${userId} kullanıcısı ${groupId} grubuna katılmak istiyor. Gerekçe: ${reason}`)
    
    return true
  }catch(e){ 
    console.error('requestJoinGroup error', e)
    throw e
  }
}

// Belirli bir kullanıcının grup için başvuru durumunu kontrol et
export function watchUserJoinRequest(db, groupId, userId, callback){
  try{
    const q = query(
      collection(db, 'join_requests'), 
      where('groupId', '==', groupId),
      where('userId', '==', userId)
    )
    return onSnapshot(q, snap => {
      const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      callback(requests.length > 0 ? requests[0] : null)
    })
  }catch(e){ 
    console.error('watchUserJoinRequest error', e)
    return ()=>{}
  }
}

// Grup yöneticisi için tüm başvuruları izle
export function watchGroupJoinRequests(db, groupId, callback){
  try{
    const q = query(
      collection(db, 'join_requests'),
      where('groupId', '==', groupId),
      where('status', '==', 'pending')
    )
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }catch(e){
    console.error('watchGroupJoinRequests error', e)
    return ()=>{}
  }
}

// Başvuruyu onayla
export async function approveJoinRequest(db, requestId, groupId, userId){
  try{
    // Başvuruyu onayla
    const requestDoc = doc(db, 'join_requests', requestId)
    await updateDoc(requestDoc, { 
      status: 'approved',
      approvedAt: serverTimestamp()
    })
    
    // Kullanıcıyı gruba ekle
    const groupDoc = doc(db, 'volunteer_groups', groupId)
    await updateDoc(groupDoc, {
      members: arrayUnion(userId),
      updatedAt: serverTimestamp()
    })
    
    // Kullanıcıya bildirim gönder
    console.log(`✅ ${userId} kullanıcısı ${groupId} grubuna onaylandı`)
    
    return true
  }catch(e){
    console.error('approveJoinRequest error', e)
    throw e
  }
}

// Başvuruyu reddet
export async function rejectJoinRequest(db, requestId, userId, groupId){
  try{
    // Başvuruyu sil
    const requestDoc = doc(db, 'join_requests', requestId)
    await deleteDoc(requestDoc)
    
    // Kullanıcıya bildirim gönder
    console.log(`❌ ${userId} kullanıcısının ${groupId} grubuna katılım isteği reddedildi`)
    
    return true
  }catch(e){
    console.error('rejectJoinRequest error', e)
    throw e
  }
}

export async function joinGroup(db, groupId, userId){
  try{
    const d = doc(db, 'volunteer_groups', groupId)
    await updateDoc(d, { 
      members: arrayUnion(userId),
      updatedAt: serverTimestamp() 
    })
  }catch(e){ console.error('joinGroup error', e) }
}

export async function startCleaning(db, groupId){
  try{
    const d = doc(db, 'volunteer_groups', groupId)
    await updateDoc(d, { status: 'active', startedAt: serverTimestamp() })
  }catch(e){ console.error('startCleaning error', e) }
}

export async function addPoints(db, groupId, pts){
  try{
    const d = doc(db, 'volunteer_groups', groupId)
    const snap = await getDoc(d)
    const currentPoints = snap.exists() ? (snap.data().points || 0) : 0
    await updateDoc(d, { points: currentPoints + pts })
  }catch(e){ console.error('addPoints error', e) }
}

export function watchRankings(db, callback){
  try{
    const q = query(collection(db, 'volunteer_groups'))
    return onSnapshot(q, snap => callback(snap.docs.map(d=>({ id:d.id, ...d.data() })).sort((a,b)=>b.points - a.points)))
  }catch(e){ console.error('watchRankings error', e); return ()=>{} }
}
