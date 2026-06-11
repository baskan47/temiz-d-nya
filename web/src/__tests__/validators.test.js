import { describe, it, expect, beforeEach } from 'vitest'
import { validators, getPasswordStrength } from '../validators'

describe('Form Validators', () => {
  describe('Email Validation', () => {
    it('should reject empty email', () => {
      const error = validators.email('')
      expect(error).toBe('Email gereklidir')
    })

    it('should reject invalid email format', () => {
      const error = validators.email('invalid-email')
      expect(error).toBe('Geçerli bir email girin')
    })

    it('should accept valid email', () => {
      const error = validators.email('user@example.com')
      expect(error).toBeNull()
    })

    it('should accept emails with subdomains', () => {
      const error = validators.email('user@mail.example.com')
      expect(error).toBeNull()
    })
  })

  describe('Password Validation', () => {
    it('should reject empty password', () => {
      const error = validators.password('')
      expect(error).toBe('Şifre gereklidir')
    })

    it('should reject password shorter than 8 chars', () => {
      const error = validators.password('Short1!')
      expect(error).toBe('Şifre en az 8 karakter olmalıdır')
    })

    it('should reject password without uppercase', () => {
      const error = validators.password('password123')
      expect(error).toBe('Şifrede en az 1 büyük harf bulunmalıdır')
    })

    it('should reject password without lowercase', () => {
      const error = validators.password('PASSWORD123')
      expect(error).toBe('Şifrede en az 1 küçük harf bulunmalıdır')
    })

    it('should reject password without number', () => {
      const error = validators.password('PasswordAbc')
      expect(error).toBe('Şifrede en az 1 rakam bulunmalıdır')
    })

    it('should accept valid password', () => {
      const error = validators.password('ValidPassword123')
      expect(error).toBeNull()
    })
  })

  describe('Password Confirmation', () => {
    it('should reject empty confirmation', () => {
      const error = validators.passwordConfirm('', 'Password123')
      expect(error).toBe('Şifre doğrulama gereklidir')
    })

    it('should reject mismatching passwords', () => {
      const error = validators.passwordConfirm('Different123', 'Password123')
      expect(error).toBe('Şifreler eşleşmiyor')
    })

    it('should accept matching passwords', () => {
      const error = validators.passwordConfirm('Password123', 'Password123')
      expect(error).toBeNull()
    })
  })

  describe('Name Validation', () => {
    it('should reject empty name', () => {
      const error = validators.name('')
      expect(error).toBe('Ad gereklidir')
    })

    it('should reject name shorter than 2 chars', () => {
      const error = validators.name('A')
      expect(error).toBe('Ad en az 2 karakter olmalıdır')
    })

    it('should reject name longer than 50 chars', () => {
      const longName = 'A'.repeat(51)
      const error = validators.name(longName)
      expect(error).toBe('Ad 50 karakterden fazla olamaz')
    })

    it('should accept valid name', () => {
      const error = validators.name('Ahmet')
      expect(error).toBeNull()
    })
  })

  describe('Phone Validation', () => {
    it('should reject empty phone', () => {
      const error = validators.phone('')
      expect(error).toBe('Telefon numarası gereklidir')
    })

    it('should accept 10-digit phone', () => {
      const error = validators.phone('5501234567')
      expect(error).toBeNull()
    })

    it('should accept 11-digit phone with 5', () => {
      const error = validators.phone('05501234567')
      expect(error).toBeNull()
    })

    it('should reject invalid format', () => {
      const error = validators.phone('123456')
      expect(error).toBe('Geçerli bir telefon numarası girin (05XX XXX XXXX)')
    })

    it('should handle formatted phone numbers', () => {
      const error = validators.phone('(0550) 123-4567')
      expect(error).toBeNull()
    })
  })

  describe('Age Validation', () => {
    it('should reject age below 18', () => {
      const error = validators.age('17')
      expect(error).toBe('18 yaşından küçükler kayıt olamaz')
    })

    it('should accept age 18 and above', () => {
      const error = validators.age('18')
      expect(error).toBeNull()
    })

    it('should reject age above 120', () => {
      const error = validators.age('150')
      expect(error).toBe('Geçerli bir yaş girin')
    })

    it('should reject non-numeric input', () => {
      const error = validators.age('abc')
      expect(error).toBe('Geçerli bir yaş girin')
    })
  })

  describe('ID Number Validation', () => {
    it('should reject empty ID', () => {
      const error = validators.idNumber('')
      expect(error).toBe('TC Kimlik No gereklidir')
    })

    it('should reject ID shorter than 11 digits', () => {
      const error = validators.idNumber('1234567890')
      expect(error).toBe('TC Kimlik No 11 basamak olmalıdır')
    })

    it('should reject ID longer than 11 digits', () => {
      const error = validators.idNumber('123456789012')
      expect(error).toBe('TC Kimlik No 11 basamak olmalıdır')
    })

    it('should reject non-numeric ID', () => {
      const error = validators.idNumber('1234567890a')
      expect(error).toBe('TC Kimlik No sadece rakam içerebilir')
    })
  })
})

describe('Password Strength', () => {
  it('should return weak for short password', () => {
    const strength = getPasswordStrength('Pass1')
    expect(strength).toBe('weak')
  })

  it('should return weak for password without uppercase', () => {
    const strength = getPasswordStrength('password123')
    expect(strength).toBe('weak')
  })

  it('should return medium for password with basics', () => {
    const strength = getPasswordStrength('Password123')
    expect(strength).toBe('medium')
  })

  it('should return strong for strong password', () => {
    const strength = getPasswordStrength('StrongPassword123!@#')
    expect(strength).toBe('strong')
  })
})
