import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  signUpWithEmailPassword,
  signInWithEmailPassword,
  signInWithPhone,
  sendVerificationEmail,
  sendPasswordResetEmailFn,
  resetPasswordWithCode,
  updateUserProfile,
  signOutUser,
  getCurrentUser,
} from '../authService'

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPhoneNumber: vi.fn(),
  signOut: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  confirmPasswordReset: vi.fn(),
  updateProfile: vi.fn(),
  currentUser: null,
  onAuthStateChanged: vi.fn(),
}))

vi.mock('../firestoreService', () => ({
  createUserDocument: vi.fn(),
  getUserDocument: vi.fn(),
}))

import * as auth from 'firebase/auth'
import * as firestore from '../firestoreService'

describe('Authentication Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Sign Up', () => {
    it('should create user with valid email and password', async () => {
      const mockUserCredential = {
        user: { uid: 'test-uid', email: 'test@example.com' },
      }
      vi.mocked(auth.createUserWithEmailAndPassword).mockResolvedValue(
        mockUserCredential
      )
      vi.mocked(firestore.createUserDocument).mockResolvedValue(undefined)

      const result = await signUpWithEmailPassword(
        'test@example.com',
        'TestPassword123!'
      )

      expect(auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object),
        'test@example.com',
        'TestPassword123!'
      )
      expect(firestore.createUserDocument).toHaveBeenCalled()
      expect(result.user.email).toBe('test@example.com')
    })

    it('should handle sign up errors', async () => {
      const error = new Error('auth/email-already-in-use')
      vi.mocked(auth.createUserWithEmailAndPassword).mockRejectedValue(error)

      await expect(
        signUpWithEmailPassword('existing@example.com', 'TestPassword123!')
      ).rejects.toThrow()
    })

    it('should throw on invalid email', async () => {
      await expect(
        signUpWithEmailPassword('invalid-email', 'TestPassword123!')
      ).rejects.toThrow()
    })

    it('should throw on weak password', async () => {
      await expect(
        signUpWithEmailPassword('test@example.com', 'weak')
      ).rejects.toThrow()
    })
  })

  describe('Sign In', () => {
    it('should sign in with valid credentials', async () => {
      const mockUserCredential = {
        user: { uid: 'test-uid', email: 'test@example.com' },
      }
      vi.mocked(auth.signInWithEmailAndPassword).mockResolvedValue(
        mockUserCredential
      )

      const result = await signInWithEmailPassword(
        'test@example.com',
        'TestPassword123!'
      )

      expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object),
        'test@example.com',
        'TestPassword123!'
      )
      expect(result.user.email).toBe('test@example.com')
    })

    it('should handle invalid credentials', async () => {
      const error = new Error('auth/user-not-found')
      vi.mocked(auth.signInWithEmailAndPassword).mockRejectedValue(error)

      await expect(
        signInWithEmailPassword('nonexistent@example.com', 'WrongPassword123!')
      ).rejects.toThrow()
    })

    it('should validate email format', async () => {
      await expect(
        signInWithEmailPassword('invalid', 'TestPassword123!')
      ).rejects.toThrow('Geçerli bir email girin')
    })
  })

  describe('Phone Sign In', () => {
    it('should initiate phone sign in', async () => {
      const mockConfirmation = {
        confirm: vi.fn(),
      }
      vi.mocked(auth.signInWithPhoneNumber).mockResolvedValue(mockConfirmation)

      const result = await signInWithPhone('+905551234567')

      expect(auth.signInWithPhoneNumber).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should handle invalid phone number', async () => {
      const error = new Error('auth/invalid-phone-number')
      vi.mocked(auth.signInWithPhoneNumber).mockRejectedValue(error)

      await expect(signInWithPhone('invalid')).rejects.toThrow()
    })

    it('should validate phone format', async () => {
      await expect(signInWithPhone('12345')).rejects.toThrow()
    })
  })

  describe('Email Verification', () => {
    it('should send verification email', async () => {
      const mockUser = { uid: 'test-uid' }
      vi.mocked(auth.sendEmailVerification).mockResolvedValue(undefined)

      await sendVerificationEmail()

      expect(auth.sendEmailVerification).toHaveBeenCalled()
    })

    it('should handle verification email error', async () => {
      const error = new Error('auth/invalid-user-token')
      vi.mocked(auth.sendEmailVerification).mockRejectedValue(error)

      await expect(sendVerificationEmail()).rejects.toThrow()
    })

    it('should retry on failure', async () => {
      const error = new Error('Network error')
      vi.mocked(auth.sendEmailVerification)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined)

      // First call fails
      await expect(sendVerificationEmail()).rejects.toThrow()

      // Second call succeeds
      await expect(sendVerificationEmail()).resolves.not.toThrow()
    })
  })

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      vi.mocked(auth.sendPasswordResetEmail).mockResolvedValue(undefined)

      await sendPasswordResetEmailFn('test@example.com')

      expect(auth.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.any(Object),
        'test@example.com'
      )
    })

    it('should handle non-existent email', async () => {
      const error = new Error('auth/user-not-found')
      vi.mocked(auth.sendPasswordResetEmail).mockRejectedValue(error)

      await expect(
        sendPasswordResetEmailFn('nonexistent@example.com')
      ).rejects.toThrow()
    })

    it('should validate email format', async () => {
      await expect(sendPasswordResetEmailFn('invalid')).rejects.toThrow()
    })

    it('should reset password with valid code', async () => {
      vi.mocked(auth.confirmPasswordReset).mockResolvedValue(undefined)

      await resetPasswordWithCode('reset-code', 'NewPassword123!')

      expect(auth.confirmPasswordReset).toHaveBeenCalledWith(
        expect.any(Object),
        'reset-code',
        'NewPassword123!'
      )
    })

    it('should handle invalid reset code', async () => {
      const error = new Error('auth/invalid-action-code')
      vi.mocked(auth.confirmPasswordReset).mockRejectedValue(error)

      await expect(
        resetPasswordWithCode('invalid-code', 'NewPassword123!')
      ).rejects.toThrow()
    })

    it('should validate new password strength', async () => {
      await expect(resetPasswordWithCode('code', 'weak')).rejects.toThrow()
    })
  })

  describe('Profile Update', () => {
    it('should update user profile', async () => {
      vi.mocked(auth.updateProfile).mockResolvedValue(undefined)

      await updateUserProfile({
        displayName: 'John Doe',
        photoURL: 'https://example.com/photo.jpg',
      })

      expect(auth.updateProfile).toHaveBeenCalled()
    })

    it('should handle update errors', async () => {
      const error = new Error('auth/operation-not-allowed')
      vi.mocked(auth.updateProfile).mockRejectedValue(error)

      await expect(
        updateUserProfile({ displayName: 'New Name' })
      ).rejects.toThrow()
    })

    it('should validate display name', async () => {
      await expect(
        updateUserProfile({ displayName: '' })
      ).rejects.toThrow('İsim boş olamaz')
    })
  })

  describe('Sign Out', () => {
    it('should sign out user', async () => {
      vi.mocked(auth.signOut).mockResolvedValue(undefined)

      await signOutUser()

      expect(auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out errors', async () => {
      const error = new Error('auth/operation-not-allowed')
      vi.mocked(auth.signOut).mockRejectedValue(error)

      await expect(signOutUser()).rejects.toThrow()
    })
  })

  describe('Get Current User', () => {
    it('should return current user', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' }
      vi.mocked(auth.onAuthStateChanged).mockImplementation((auth, callback) => {
        callback(mockUser)
        return () => {}
      })

      const user = await getCurrentUser()

      expect(user).toEqual(mockUser)
    })

    it('should return null if no user is logged in', async () => {
      vi.mocked(auth.onAuthStateChanged).mockImplementation((auth, callback) => {
        callback(null)
        return () => {}
      })

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const error = new Error('Network error')
      vi.mocked(auth.signInWithEmailAndPassword).mockRejectedValue(error)

      await expect(
        signInWithEmailPassword('test@example.com', 'TestPassword123!')
      ).rejects.toThrow()
    })

    it('should handle timeout errors', async () => {
      const error = new Error('auth/timeout')
      vi.mocked(auth.createUserWithEmailAndPassword).mockRejectedValue(error)

      await expect(
        signUpWithEmailPassword('test@example.com', 'TestPassword123!')
      ).rejects.toThrow()
    }, { timeout: 10000 })
  })

  describe('Validation', () => {
    it('should validate email format before submission', () => {
      const invalidEmails = [
        'invalid',
        'test@',
        '@example.com',
        'test@example',
        'test example@test.com',
      ]

      invalidEmails.forEach((email) => {
        expect(() =>
          signInWithEmailPassword(email, 'TestPassword123!')
        ).rejects.toThrow()
      })
    })

    it('should enforce password requirements', () => {
      const weakPasswords = [
        '123456', // only numbers
        'abcdef', // only lowercase
        'ABCDEF', // only uppercase
        'Abc123', // too short
        'abcdefghijklmnop', // no numbers
      ]

      weakPasswords.forEach((password) => {
        expect(() =>
          signUpWithEmailPassword('test@example.com', password)
        ).rejects.toThrow()
      })
    })

    it('should validate phone format', () => {
      const invalidPhones = [
        '12345', // too short
        'abc1234567', // contains letters
        '90', // incomplete
        '+9090551234567', // invalid country code for Turkey
      ]

      invalidPhones.forEach((phone) => {
        expect(() => signInWithPhone(phone)).rejects.toThrow()
      })
    })
  })
})
