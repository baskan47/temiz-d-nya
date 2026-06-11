import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import { FIREBASE_CONFIG, isFirebaseConfigured } from './firebase-config'

let firebaseInitialized = false
export function initFirebase(){
  if(firebaseInitialized) return
  try{
    if(!isFirebaseConfigured()) return
    const app = initializeApp(FIREBASE_CONFIG)
    const db = getFirestore(app)
    const auth = getAuth(app)
    const storage = getStorage(app)
    firebaseInitialized = true
    window.firestore = db
    window.auth = auth
    window.storage = storage
    window.firebaseConnected = true
    document.dispatchEvent(new CustomEvent('firebase-ready'))
    console.log('Firebase initialized')
  }catch(e){
    console.error('firebase init error', e)
  }
}
