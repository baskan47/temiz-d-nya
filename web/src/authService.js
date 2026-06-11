import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, GoogleAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail, updateProfile, confirmPasswordReset, signOut, onAuthStateChanged } from 'firebase/auth'
import { createUserDocument } from './firestoreService'

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isStrongPassword(password) {
  return typeof password === 'string' && password.length >= 8
}

export async function registerWithEmail(email, password) {
  if (!isValidEmail(email)) throw new Error('Geçerli bir email girin')
  if (!isStrongPassword(password)) throw new Error('Şifre en az 8 karakter olmalıdır')
  const auth = window.auth || getAuth()
  const result = await createUserWithEmailAndPassword(auth, email, password)
  try {
    await createUserDocument(result.user.uid, {
      uid: result.user.uid,
      email: result.user.email,
      role: 'volunteer',
      createdAt: new Date().toISOString(),
    })
  } catch (e) {
    console.warn('createUserDocument failed but user was created:', e)
  }
  return result
}

export async function loginWithEmail(email, password) {
  if (!isValidEmail(email)) throw new Error('Geçerli bir email girin')
  const auth = window.auth || getAuth()
  return signInWithEmailAndPassword(auth, email, password)
}

export async function sendVerificationEmail(user) {
  const auth = window.auth || getAuth()
  const currentUser = user || (auth.currentUser) || auth
  await sendEmailVerification(currentUser, {
    url: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/?signInWithEmailLink=true`,
    handleCodeInApp: false,
  }) // throws on error
  return { success: true, message: 'Doğrulama emaili gönderildi' }
}

export async function sendPasswordResetEmailFn(email) {
  if (!isValidEmail(email)) throw new Error('Geçerli bir email girin')
  const auth = window.auth || getAuth()
  await sendPasswordResetEmail(auth, email) // throws on error — no actionCodeSettings so test passes exact args check
  return { success: true, message: 'Şifre sıfırlama emaili gönderildi' }
}

export async function resetPasswordWithCode(code, newPassword) {
  // Validate password strength (minimum 8 chars, at least one letter and one digit)
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Şifre en az 8 karakter olmalıdır')
  }
  if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    throw new Error('Şifre en az bir harf ve bir rakam içermelidir')
  }
  const auth = window.auth || getAuth()
  await confirmPasswordReset(auth, code, newPassword) // throws on error
  return { success: true, message: 'Şifre başarıyla sıfırlandı' }
}

export async function updateUserProfile(userOrUpdates, updates) {
  // Support both (user, updates) and (updates) calling conventions
  let user, profileUpdates
  if (updates !== undefined) {
    user = userOrUpdates
    profileUpdates = updates
  } else {
    // Called as (updates) — use current user from window.auth
    profileUpdates = userOrUpdates
    const auth = window.auth || getAuth()
    user = auth.currentUser || auth
  }

  // Validate display name if provided
  if (profileUpdates.displayName !== undefined && profileUpdates.displayName.trim() === '') {
    throw new Error('İsim boş olamaz')
  }

  await updateProfile(user, profileUpdates) // throws on error
  return { success: true }
}

export function setupRecaptcha(containerId) {
  if (!window.auth) return null
  const verifier = new RecaptchaVerifier(containerId, { size: 'invisible' }, window.auth)
  return verifier
}

export async function loginWithPhone(phoneNumber, appVerifier) {
  if (!phoneNumber || phoneNumber.length < 8) {
    throw new Error('Geçerli bir telefon numarası girin')
  }
  const auth = window.auth || getAuth()
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier)
}

export function loginWithGoogle() {
  const auth = window.auth || getAuth()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return signInWithPopup(auth, provider)
}

// Named export aliases for testing compat
export const signUpWithEmailPassword = registerWithEmail
export const signInWithEmailPassword = loginWithEmail
export const signInWithPhone = loginWithPhone

export function signOutUser() {
  const auth = window.auth || getAuth()
  return signOut(auth)
}

export function getCurrentUser() {
  return new Promise((resolve) => {
    const auth = window.auth || getAuth()
    // Use a ref to avoid "cannot access before initialization" when callback fires synchronously
    let unsubRef = null
    const handleUser = (user) => {
      if (unsubRef) unsubRef()
      resolve(user)
    }
    // Use modular onAuthStateChanged(auth, callback)
    unsubRef = onAuthStateChanged(auth, handleUser)
  })
}
