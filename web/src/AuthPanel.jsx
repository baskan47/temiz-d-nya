import React, { useState, useEffect } from 'react'
import * as authService from './authService'
import { validators, getPasswordStrength } from './validators'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'

function translateAuthError(error) {
  const code = error?.code || error?.message || '';
  if (code.includes('email-already-in-use') || code.includes('email-already-exists')) {
    return 'Bu e-posta adresi ile kayıtlı bir hesap zaten var.';
  }
  if (code.includes('invalid-credential') || code.includes('user-not-found') || code.includes('wrong-password')) {
    return 'E-posta adresi veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.';
  }
  if (code.includes('weak-password')) {
    return 'Şifre çok zayıf. En az 8 karakter, büyük harf ve rakam ekleyin.';
  }
  if (code.includes('invalid-email')) {
    return 'Geçersiz e-posta adresi. Lütfen kontrol edin.';
  }
  if (code.includes('too-many-requests')) {
    return 'Çok fazla deneme. Lütfen birkaç dakika bekleyin.';
  }
  if (code.includes('network-request-failed')) {
    return 'İnternet bağlantısı yok. Bağlantınızı kontrol edin.';
  }
  return error?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

export default function AuthPanel({ onLoggedIn }) {
  const [mode, setMode] = useState('login') // login | register | phone
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [phone, setPhone] = useState('')
  const [age, setAge] = useState('')
  const [idNumber, setIdNumber] = useState('')

  // Error states
  const [errors, setErrors] = useState({})
  const [showConsent, setShowConsent] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)
  const [passwordStrength, setPasswordStrength] = useState('weak')

  // Email verification states
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)

  useEffect(() => {
    // Initialize reCAPTCHA for phone auth
    if (mode === 'phone' && window.auth && !recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(window.auth, 'recaptcha-container', {
          size: 'normal',
          callback: (response) => {
            console.log('reCAPTCHA solved')
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired')
          }
        })
        setRecaptchaVerifier(verifier)
      } catch (error) {
        console.error('reCAPTCHA initialization error:', error)
      }
    }

    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear()
      }
    }
  }, [mode])

  // Validate register form
  const validateRegisterForm = () => {
    const newErrors = {}

    // Validate all fields
    newErrors.name = validators.name(name)
    newErrors.surname = validators.surname(surname)
    newErrors.phone = validators.phone(phone)
    newErrors.age = validators.age(age)
    newErrors.idNumber = validators.idNumber(idNumber)
    newErrors.email = validators.email(email)
    newErrors.password = validators.password(password)
    newErrors.passwordConfirm = validators.passwordConfirm(passwordConfirm, password)

    // Remove empty error keys
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key]
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validate login form
  const validateLoginForm = () => {
    const newErrors = {}

    newErrors.email = validators.email(email)
    newErrors.password = validators.password(password)

    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key]
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleRegister(e) {
    e.preventDefault()
    
    // Validate first
    if (!validateRegisterForm()) {
      return
    }

    try {
      const res = await authService.registerWithEmail(email, password)
      setPendingUser({
        uid: res.user.uid,
        email: res.user.email,
        name,
        surname,
        phone,
        age: Number(age),
        idNumber
      })
      setShowConsent(true)
      setErrors({})
    } catch (e) {
      console.error(e)
      setErrors({ submit: translateAuthError(e) })
    }
  }

  async function acceptConsent() {
    if (!pendingUser) return
    try {
      // Create user profile
      if (window.firestore) {
        await window.firestore.collection('users').doc(pendingUser.uid).set({
          name: pendingUser.name,
          surname: pendingUser.surname,
          phone: pendingUser.phone,
          age: pendingUser.age,
          idNumber: pendingUser.idNumber,
          email: pendingUser.email,
          role: 'volunteer',
          verified: false,
          emailVerified: false,
          createdAt: new Date()
        })
      }

      // Send email verification
      const currentUser = window.auth?.currentUser
      if (currentUser) {
        await authService.sendVerificationEmail(currentUser)
      }

      // Sign out the auto-logged-in user
      await authService.signOutUser()

      // Reset registration inputs
      setName('')
      setSurname('')
      setPhone('')
      setAge('')
      setIdNumber('')
      setPasswordConfirm('')
      setEmail('')
      setPassword('')

      setShowConsent(false)
      setPendingUser(null)
      setErrors({})
      setEmailVerificationSent(false)
      setShowVerificationMessage(false)

      // Alert & switch mode to login
      alert('Üyelik oluşturuldu! E-posta doğrulama linki gönderildi, lütfen e-postanızı doğrulayıp giriş yapın.')
      setMode('login')
    } catch (e) {
      console.error(e)
      setErrors({ submit: 'Kayıt hatası: ' + translateAuthError(e) })
    }
  }

  
  async function handleGoogleLogin() {
    try {
      const res = await authService.loginWithGoogle()
      
      // Create user profile if first time
      if (window.firestore) {
        const userDoc = await window.firestore.collection('users').doc(res.user.uid).get()
        if (!userDoc.exists) {
          await window.firestore.collection('users').doc(res.user.uid).set({
            name: res.user.displayName || '',
            email: res.user.email,
            phone: res.user.phoneNumber || '',
            role: 'volunteer',
            verified: false,
            createdAt: new Date()
          })
        }
      }
      
      onLoggedIn && onLoggedIn(res.user)
    } catch (e) {
      console.error(e)
      alert('Google giri� hatas�: ' + e.message)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    
    // Validate first
    if (!validateLoginForm()) {
      return
    }

    try {
      const res = await authService.loginWithEmail(email, password)
      
      // Auto-heal: If profile document is missing in Firestore, create it
      if (window.firestore) {
        const userDoc = await window.firestore.collection('users').doc(res.user.uid).get()
        if (!userDoc.exists) {
          await window.firestore.collection('users').doc(res.user.uid).set({
            name: res.user.displayName || 'Gönüllü',
            email: res.user.email || '',
            phone: res.user.phoneNumber || '',
            role: 'volunteer',
            verified: false,
            createdAt: new Date()
          })
        }
      }

      setErrors({})
      onLoggedIn && onLoggedIn(res.user)
    } catch (e) {
      console.error(e)
      setErrors({ submit: translateAuthError(e) })
    }
  }

  async function handleSendPhoneCode(e) {
    e.preventDefault()
    if (!phone || !recaptchaVerifier) {
      alert('Telefon numarası girin ve reCAPTCHA doğrulaması yapın')
      return
    }

    try {
      // Phone number should be in E.164 format: +90XXXXXXXXXX
      const formattedPhone = phone.startsWith('+') ? phone : `+90${phone}`
      
      const confirmationResult = await signInWithPhoneNumber(
        window.auth,
        formattedPhone,
        recaptchaVerifier
      )
      
      setPhoneVerificationId(confirmationResult.verificationId)
      alert('Doğrulama kodu gönderildi!')
    } catch (error) {
      console.error('Phone verification error:', error)
      alert('Kod gönderme hatası: ' + error.message)
      
      // Reset reCAPTCHA on error
      if (recaptchaVerifier) {
        recaptchaVerifier.clear()
        setRecaptchaVerifier(null)
      }
    }
  }

  async function handleVerifyPhoneCode(e) {
    e.preventDefault()
    if (!verificationCode || !phoneVerificationId) {
      alert('Doğrulama kodunu girin')
      return
    }

    try {
      const credential = window.firebase.auth.PhoneAuthProvider.credential(
        phoneVerificationId,
        verificationCode
      )
      const result = await window.auth.signInWithCredential(credential)
      
      // Create user profile if first time
      if (window.firestore) {
        const userDoc = await window.firestore.collection('users').doc(result.user.uid).get()
        if (!userDoc.exists) {
          await window.firestore.collection('users').doc(result.user.uid).set({
            phone: result.user.phoneNumber,
            role: 'volunteer',
            verified: false,
            createdAt: new Date()
          })
        }
      }
      
      onLoggedIn && onLoggedIn(result.user)
    } catch (error) {
      console.error('Code verification error:', error)
      alert('Kod doğrulama hatası: ' + error.message)
    }
  }

  return (
    <div className="card">
      <h3>
        {mode === 'login' && '🔐 Giriş Yap'}
        {mode === 'register' && '🌱 Kayıt Ol'}
        {mode === 'phone' && '📱 Telefon ile Giriş'}
      </h3>

      {errors.submit && (
        <div style={{
          background: '#fee2e2',
          color: '#991b1b',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '12px',
          fontSize: '14px'
        }}>
          ❌ {errors.submit}
        </div>
      )}

      {mode === 'phone' ? (
        <div>
          {!phoneVerificationId ? (
            <form onSubmit={handleSendPhoneCode}>
              <div style={{ display: 'grid', gap: 8 }}>
                <div>
                  <input
                    placeholder="Telefon (+90XXXXXXXXXX)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{
                      borderColor: errors.phone ? '#ef4444' : undefined
                    }}
                  />
                  {errors.phone && (
                    <small style={{ color: '#ef4444', display: 'block', marginTop: 4 }}>
                      {errors.phone}
                    </small>
                  )}
                </div>
                <div id="recaptcha-container" style={{ margin: '12px 0' }}></div>
                <button type="submit">Kod Gönder</button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setErrors({})
                  }}
                  style={{ background: '#6b7280' }}
                >
                  Email ile Giriş
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneCode}>
              <div style={{ display: 'grid', gap: 8 }}>
                <p style={{ fontSize: 14, color: '#666', margin: '0 0 8px' }}>
                  {phone} numarasına gönderilen kodu girin:
                </p>
                <input
                  placeholder="Doğrulama Kodu (6 haneli)"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
                <button type="submit">Doğrula</button>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneVerificationId(null)
                    setVerificationCode('')
                  }}
                  style={{ background: '#6b7280' }}
                >
                  Yeni Kod Gönder
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          <div style={{ display: 'grid', gap: 8 }}>
            {mode === 'register' && (
              <>
                <div>
                  <input
                    placeholder="İsim"
                    value={name}
                    onChange={e => {
                      setName(e.target.value)
                      if (errors.name) setErrors({ ...errors, name: null })
                    }}
                    style={{
                      borderColor: errors.name ? '#ef4444' : undefined
                    }}
                  />
                  {errors.name && (
                    <small style={{ color: '#ef4444', display: 'block', marginTop: 4 }}>
                      {errors.name}
                    </small>
                  )}
                </div>

                <div>
                  <input
                    placeholder="Soyadı"
                    value={surname}
                    onChange={e => {
                      setSurname(e.target.value)
                      if (errors.surname) setErrors({ ...errors, surname: null })
                    }}
                    style={{
                      borderColor: errors.surname ? '#ef4444' : undefined
                    }}
                  />
                  {errors.surname && (
                    <small style={{ color: '#ef4444', display: 'block', marginTop: 4 }}>
                      {errors.surname}
                    </small>
                  )}
                </div>

                <div>
                  <input
                    placeholder="Telefon (05XX XXX XXXX)"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value)
                      if (errors.phone) setErrors({ ...errors, phone: null })
                    }}
                    style={{
                      borderColor: errors.phone ? '#ef4444' : undefined
                    }}
                  />
                  {errors.phone && (
                    <small style={{ color: '#ef4444', display: 'block', marginTop: 4 }}>
                      {errors.phone}
                    </small>
                  )}
                </div>

                <div>
                  <input
                    placeholder="Yaş"
                    value={age}
                    onChange={e => {
                      setAge(e.target.value)
                      if (errors.age) setErrors({ ...errors, age: null })
                    }}
                    type="number"
                    min="18"
                    style={{
                      borderColor: errors.age ? '#ef4444' : undefined
                    }}
                  />
                  {errors.age && (
                    <small style={{ color: '#ef4444', display: 'block', marginTop: 4 }}>
                      {errors.age}
                    </small>
                  )}
                </div>

                <div>
                  <input
                    placeholder="TC Kimlik No (11 basamak)"
                    value={idNumber}
                    onChange={e => {
                      setIdNumber(e.target.value)
                      if (errors.idNumber) setErrors({ ...errors, idNumber: null })
                    }}
                    style={{
                      borderColor: errors.idNumber ? '#ef4444' : undefined
                    }}
                  />
                  {errors.idNumber && (
                    <small style={{ color: '#ef4444', display: 'block', marginTop: 4 }}>
                      {errors.idNumber}
                    </small>
                  )}
                </div>
              </>
            )}

            <div>
              <input
                placeholder="Email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors({ ...errors, email: null })
                }}
                type="email"
                style={{
                  borderColor: errors.email ? '#ef4444' : undefined
                }}
              />
              {errors.email && (
                <small style={{ color: '#ef4444', display: 'block', marginTop: 4 }}>
                  {errors.email}
                </small>
              )}
            </div>

            <div>
              <input
                placeholder="Parola (Min 8 karakter, büyük harf, rakam)"
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  setPasswordStrength(getPasswordStrength(e.target.value))
                  if (errors.password) setErrors({ ...errors, password: null })
                }}
                style={{
                  borderColor: errors.password ? '#ef4444' : undefined
                }}
              />
              {password && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '4px',
                  fontSize: '12px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '4px',
                    background: passwordStrength === 'weak' ? '#ef4444' : passwordStrength === 'medium' ? '#f59e0b' : '#10b981',
                    borderRadius: '2px'
                  }}></div>
                  <span style={{
                    color: passwordStrength === 'weak' ? '#ef4444' : passwordStrength === 'medium' ? '#f59e0b' : '#10b981'
                  }}>
                    {passwordStrength === 'weak' ? 'Zayıf' : passwordStrength === 'medium' ? 'Orta' : 'Güçlü'}
                  </span>
                </div>
              )}
              {errors.password && (
                <small style={{ color: '#ef4444', display: 'block', marginTop: 4 }}>
                  {errors.password}
                </small>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <input
                  placeholder="Parola Doğrulama"
                  type="password"
                  value={passwordConfirm}
                  onChange={e => {
                    setPasswordConfirm(e.target.value)
                    if (errors.passwordConfirm) setErrors({ ...errors, passwordConfirm: null })
                  }}
                  style={{
                    borderColor: errors.passwordConfirm ? '#ef4444' : undefined
                  }}
                />
                {errors.passwordConfirm && (
                  <small style={{ color: '#ef4444', display: 'block', marginTop: 4 }}>
                    {errors.passwordConfirm}
                  </small>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="submit">{mode === 'login' ? '🔐 Giriş' : '✅ Kayıt Ol'}</button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login')
                  setErrors({})
                  // Reset form
                  setEmail('')
                  setPassword('')
                  setPasswordConfirm('')
                }}
                style={{ background: '#6b7280' }}
              >
                {mode === 'login' ? '📝 Kayıt Ol' : '🔐 Giriş Yap'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('phone')
                  setErrors({})
                }}
                style={{ background: '#3b82f6' }}
              >
                📱 Telefon ile Giriş
              </button>
            </div>
          </div>
        </form>
      )}

      {showConsent && (
        <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 8 }}>
          <h4>Aydınlatma Metni ve Güvenlik Uyarısı</h4>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            Bu uygulamada kimyasal maddeler, kesici malzemeler ve tehlikeli atıklarla temas
            edilmemesi önemle belirtilir. Bu tür maddeler bulunduğunda lütfen "Belediyeye Bildir"
            butonunu kullanarak yetkililere haber verin ve onların yönlendirmesine uyun. İzinsiz
            veya tehlikeli temas durumlarında oluşabilecek sorumluluklar kullanıcıya aittir;
            uygulama yalnızca bildirim ve koordinasyon amaçlıdır.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={acceptConsent}
              style={{
                background: '#059669',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 6
              }}
            >
              Kabul Ediyorum
            </button>
            <button
              onClick={() => {
                setShowConsent(false)
                setPendingUser(null)
              }}
              style={{ padding: '8px 16px', borderRadius: 6, background: '#ef4444', color: '#fff' }}
            >
              Reddet
            </button>
          </div>
        </div>
      )}

      {showVerificationMessage && emailVerificationSent && (
        <div style={{
          marginTop: 12,
          padding: 16,
          background: '#d1fae5',
          border: '1px solid #10b981',
          borderRadius: 8,
          color: '#065f46'
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            ✅ Kayıt Başarılı!
          </div>
          <p style={{ fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}>
            Hesabınız oluşturulmuştur. Lütfen email adresinize gönderilen <strong>doğrulama linkine tıklayın</strong>.
          </p>
          <p style={{ fontSize: 12, margin: 0, opacity: 0.8 }}>
            Email almadıysanız spam klasörünü kontrol edin veya <button
              onClick={async () => {
                const currentUser = window.auth?.currentUser
                if (currentUser) {
                  const result = await authService.sendVerificationEmail(currentUser)
                  if (result.success) {
                    alert('Doğrulama emaili yeniden gönderildi')
                  }
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#059669',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
                font: 'inherit'
              }}
            >
              burada yeniden gönder
            </button>
          </p>
          <button
            onClick={() => {
              setShowVerificationMessage(false)
              onLoggedIn && onLoggedIn({ uid: pendingUser?.uid, email: pendingUser?.email })
            }}
            style={{
              marginTop: 12,
              background: '#10b981',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Devam Et
          </button>
        </div>
      )}
    </div>
  )
}