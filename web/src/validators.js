/**
 * 📋 Form Validators
 * Email, Password, Phone, ID Number validations
 */

export const validators = {
  /**
   * Email validation
   */
  email: (value) => {
    if (!value) return 'Email gereklidir'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return 'Geçerli bir email girin'
    return null
  },

  /**
   * Password validation
   * Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
   */
  password: (value) => {
    if (!value) return 'Şifre gereklidir'
    if (value.length < 8) return 'Şifre en az 8 karakter olmalıdır'
    
    // Check for uppercase
    if (!/[A-Z]/.test(value)) return 'Şifrede en az 1 büyük harf bulunmalıdır'
    
    // Check for lowercase
    if (!/[a-z]/.test(value)) return 'Şifrede en az 1 küçük harf bulunmalıdır'
    
    // Check for numbers
    if (!/[0-9]/.test(value)) return 'Şifrede en az 1 rakam bulunmalıdır'
    
    return null
  },

  /**
   * Password confirmation - check if matches password field
   */
  passwordConfirm: (value, password) => {
    if (!value) return 'Şifre doğrulama gereklidir'
    if (value !== password) return 'Şifreler eşleşmiyor'
    return null
  },

  /**
   * Name validation
   */
  name: (value) => {
    if (!value) return 'Ad gereklidir'
    if (value.trim().length < 2) return 'Ad en az 2 karakter olmalıdır'
    if (value.length > 50) return 'Ad 50 karakterden fazla olamaz'
    return null
  },

  /**
   * Surname validation
   */
  surname: (value) => {
    if (!value) return 'Soyadı gereklidir'
    if (value.trim().length < 2) return 'Soyadı en az 2 karakter olmalıdır'
    if (value.length > 50) return 'Soyadı 50 karakterden fazla olamaz'
    return null
  },

  /**
   * Age validation
   */
  age: (value) => {
    if (!value) return 'Yaş gereklidir'
    const age = Number(value)
    if (isNaN(age)) return 'Geçerli bir yaş girin'
    if (age < 18) return '18 yaşından küçükler kayıt olamaz'
    if (age > 120) return 'Geçerli bir yaş girin'
    return null
  },

  /**
   * Phone validation (Turkish format)
   */
  phone: (value) => {
    if (!value) return 'Telefon numarası gereklidir'
    // Remove non-digit characters
    const digits = value.replace(/\D/g, '')
    // Turkish phone: 10 digits (0 removed) or 11 digits (with 0)
    if (digits.length === 10) return null
    if (digits.length === 11 && digits.startsWith('05')) return null
    return 'Geçerli bir telefon numarası girin (05XX XXX XXXX)'
  },

  /**
   * ID Number validation (Turkish T.C.)
   */
  idNumber: (value) => {
    if (!value) return 'TC Kimlik No gereklidir'
    if (/[^\d\s-]/.test(value)) return 'TC Kimlik No sadece rakam içerebilir'
    const digits = value.replace(/\D/g, '')
    if (digits.length !== 11) return 'TC Kimlik No 11 basamak olmalıdır'
    
    // Basic Luhn algorithm check for TC ID
    if (!validateTCID(digits)) return 'Geçersiz TC Kimlik No'
    
    return null
  },

  /**
   * Group name validation
   */
  groupName: (value) => {
    if (!value) return 'Grup adı gereklidir'
    if (value.trim().length < 3) return 'Grup adı en az 3 karakter olmalıdır'
    if (value.length > 100) return 'Grup adı 100 karakterden fazla olamaz'
    return null
  },

  /**
   * Report description validation
   */
  description: (value, minLength = 10, maxLength = 500) => {
    if (!value) return 'Açıklama gereklidir'
    if (value.trim().length < minLength) 
      return `Açıklama en az ${minLength} karakter olmalıdır`
    if (value.length > maxLength) 
      return `Açıklama ${maxLength} karakterden fazla olamaz`
    return null
  },

  /**
   * Area (number) validation
   */
  area: (value) => {
    if (!value) return 'Alan gereklidir'
    const area = parseFloat(value)
    if (isNaN(area)) return 'Geçerli bir alan değeri girin'
    if (area <= 0) return 'Alan 0 dan büyük olmalıdır'
    if (area > 10000) return 'Alan 10000 den büyük olamaz'
    return null
  },

  /**
   * Weight (number) validation
   */
  weight: (value) => {
    if (!value) return 'Ağırlık gereklidir'
    const weight = parseFloat(value)
    if (isNaN(weight)) return 'Geçerli bir ağırlık değeri girin'
    if (weight <= 0) return 'Ağırlık 0 dan büyük olmalıdır'
    if (weight > 100000) return 'Ağırlık 100000 den büyük olamaz'
    return null
  },

  /**
   * Required field
   */
  required: (value, fieldName = 'Bu alan') => {
    if (!value || value.toString().trim() === '') 
      return `${fieldName} gereklidir`
    return null
  }
}

/**
 * Validate Turkish Citizen ID (TC Kimlik No)
 * Using basic checksum algorithm
 */
function validateTCID(id) {
  if (id.length !== 11 || id[0] === '0') return false
  
  // Calculate checksum
  let sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(id[i]) * (i % 2 === 0 ? 7 : 8)
  }
  
  const check = sum % 11
  const lastDigit = parseInt(id[10])
  
  return check === lastDigit
}

/**
 * Password strength indicator
 * Returns: weak, medium, strong
 */
export function getPasswordStrength(password) {
  if (!password) return 'weak'
  
  let strength = 0
  
  // Length
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  
  // Variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++
  
  if (strength <= 2) return 'weak'
  if (strength <= 3) return 'medium'
  return 'strong'
}

/**
 * Format phone number for display
 */
export function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length === 10) {
    return `(05${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5)}`
  }
  
  if (digits.length === 11) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  
  return phone
}

/**
 * Format ID number for display
 */
export function formatIDNumber(id) {
  const digits = id.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 8)}-${digits.slice(8)}`
  }
  return id
}
