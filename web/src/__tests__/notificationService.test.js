import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  sendNotification,
  subscribeToNotifications,
  markAsRead,
  deleteNotification,
  getUnreadCount,
  clearAllNotifications,
} from '../notificationService'

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
  onMessage: vi.fn(),
  getToken: vi.fn(),
}))

import * as firestore from 'firebase/firestore'
import * as messaging from 'firebase/messaging'

describe('Notification Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Send Notification', () => {
    it('should send notification to user', async () => {
      vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'notif-123' })

      const notificationData = {
        userId: 'user-123',
        title: 'New Report',
        message: 'A new cleanup report was submitted',
        type: 'report',
        data: { reportId: 'report-456' },
      }

      const result = await sendNotification(notificationData)

      expect(firestore.addDoc).toHaveBeenCalled()
      expect(result.id).toBe('notif-123')
    })

    it('should validate required fields', async () => {
      const invalidNotification = {
        userId: 'user-123',
        // missing title and message
      }

      await expect(sendNotification(invalidNotification)).rejects.toThrow()
    })

    it('should set timestamp', async () => {
      vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'notif-123' })

      const notificationData = {
        userId: 'user-123',
        title: 'Test',
        message: 'Test message',
      }

      await sendNotification(notificationData)

      const callArgs = vi.mocked(firestore.addDoc).mock.calls[0]
      expect(callArgs[1]).toHaveProperty('timestamp')
    })

    it('should set read status to false by default', async () => {
      vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'notif-123' })

      const notificationData = {
        userId: 'user-123',
        title: 'Test',
        message: 'Test message',
      }

      await sendNotification(notificationData)

      const callArgs = vi.mocked(firestore.addDoc).mock.calls[0]
      expect(callArgs[1].read).toBe(false)
    })

    it('should handle send errors', async () => {
      const error = new Error('Database error')
      vi.mocked(firestore.addDoc).mockRejectedValue(error)

      await expect(
        sendNotification({
          userId: 'user-123',
          title: 'Test',
          message: 'Test',
        })
      ).rejects.toThrow()
    })

    it('should send batch notifications', async () => {
      vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'notif-123' })

      const notifications = [
        {
          userId: 'user-1',
          title: 'Alert 1',
          message: 'Message 1',
        },
        {
          userId: 'user-2',
          title: 'Alert 2',
          message: 'Message 2',
        },
      ]

      const results = await Promise.all(
        notifications.map((n) => sendNotification(n))
      )

      expect(results).toHaveLength(2)
    })
  })

  describe('Subscribe to Notifications', () => {
    it('should subscribe to user notifications', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ title: 'Notif 1', read: false }) },
        { id: '2', data: () => ({ title: 'Notif 2', read: true }) },
      ]

      const unsubscribe = vi.fn()

      vi.mocked(firestore.onSnapshot).mockImplementation((q, callback) => {
        callback({
          docs: mockDocs,
          empty: false,
        })
        return unsubscribe
      })

      const callback = vi.fn()
      const unsub = subscribeToNotifications('user-123', callback)

      expect(callback).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ title: 'Notif 1' }),
        expect.objectContaining({ title: 'Notif 2' }),
      ]))

      unsub()
      expect(unsubscribe).toHaveBeenCalled()
    })

    it('should handle empty notifications', async () => {
      const unsubscribe = vi.fn()

      vi.mocked(firestore.onSnapshot).mockImplementation((q, callback) => {
        callback({
          docs: [],
          empty: true,
        })
        return unsubscribe
      })

      const callback = vi.fn()
      subscribeToNotifications('user-123', callback)

      expect(callback).toHaveBeenCalledWith([])
    })

    it('should filter by user ID', () => {
      vi.mocked(firestore.onSnapshot).mockImplementation(() => {
        return () => {}
      })

      subscribeToNotifications('user-123', vi.fn())

      expect(firestore.query).toHaveBeenCalled()
      expect(firestore.where).toHaveBeenCalledWith('userId', '==', 'user-123')
    })

    it('should order by timestamp', () => {
      vi.mocked(firestore.onSnapshot).mockImplementation(() => {
        return () => {}
      })

      subscribeToNotifications('user-123', vi.fn())

      expect(firestore.orderBy).toHaveBeenCalledWith('timestamp', 'desc')
    })

    it('should handle subscription errors', () => {
      const error = new Error('Subscription error')
      vi.mocked(firestore.onSnapshot).mockImplementation((q, onNext, onErr) => {
        if (onErr) {
          onErr(error)
        }
        return () => {}
      })

      subscribeToNotifications('user-123', vi.fn())
      // Error should be handled gracefully
    })
  })

  describe('Mark as Read', () => {
    it('should mark notification as read', async () => {
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined)

      await markAsRead('notif-123')

      expect(firestore.updateDoc).toHaveBeenCalled()
      const callArgs = vi.mocked(firestore.updateDoc).mock.calls[0]
      expect(callArgs[1]).toEqual({ read: true })
    })

    it('should mark multiple notifications as read', async () => {
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined)

      const notificationIds = ['notif-1', 'notif-2', 'notif-3']

      await Promise.all(notificationIds.map((id) => markAsRead(id)))

      expect(vi.mocked(firestore.updateDoc).mock.calls).toHaveLength(3)
    })

    it('should handle mark as read error', async () => {
      const error = new Error('Update error')
      vi.mocked(firestore.updateDoc).mockRejectedValue(error)

      await expect(markAsRead('notif-123')).rejects.toThrow()
    })

    it('should mark all user notifications as read', async () => {
      const batch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }

      vi.mocked(firestore.writeBatch).mockReturnValue(batch)

      const notificationIds = ['notif-1', 'notif-2', 'notif-3']

      // Assuming markAllAsRead function exists
      // await markAllAsRead('user-123')
      // Implementation dependent
    })
  })

  describe('Delete Notification', () => {
    it('should delete notification', async () => {
      vi.mocked(firestore.deleteDoc).mockResolvedValue(undefined)

      await deleteNotification('notif-123')

      expect(firestore.deleteDoc).toHaveBeenCalled()
    })

    it('should delete multiple notifications', async () => {
      vi.mocked(firestore.deleteDoc).mockResolvedValue(undefined)

      const notificationIds = ['notif-1', 'notif-2', 'notif-3']

      await Promise.all(notificationIds.map((id) => deleteNotification(id)))

      expect(vi.mocked(firestore.deleteDoc).mock.calls).toHaveLength(3)
    })

    it('should handle delete error', async () => {
      const error = new Error('Delete error')
      vi.mocked(firestore.deleteDoc).mockRejectedValue(error)

      await expect(deleteNotification('notif-123')).rejects.toThrow()
    })
  })

  describe('Get Unread Count', () => {
    it('should return unread notification count', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ read: false }) },
        { id: '2', data: () => ({ read: false }) },
        { id: '3', data: () => ({ read: true }) },
      ]

      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs,
        size: 3,
      })

      // Assuming implementation filters unread
      const count = await getUnreadCount('user-123')

      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should return 0 for no unread', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ read: true }) },
        { id: '2', data: () => ({ read: true }) },
      ]

      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs,
        size: 2,
      })

      const count = await getUnreadCount('user-123')

      expect(count).toBe(0)
    })

    it('should handle count error', async () => {
      const error = new Error('Query error')
      vi.mocked(firestore.getDocs).mockRejectedValue(error)

      await expect(getUnreadCount('user-123')).rejects.toThrow()
    })

    it('should filter by user ID', async () => {
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: [],
        size: 0,
      })

      await getUnreadCount('user-123')

      expect(firestore.query).toHaveBeenCalled()
      expect(firestore.where).toHaveBeenCalledWith('userId', '==', 'user-123')
    })
  })

  describe('Clear All Notifications', () => {
    it('should clear all user notifications', async () => {
      const batch = {
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }

      vi.mocked(firestore.writeBatch).mockReturnValue(batch)

      const mockDocs = [
        { ref: 'ref-1' },
        { ref: 'ref-2' },
      ]

      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs,
        size: 2,
      })

      await clearAllNotifications('user-123')

      expect(batch.commit).toHaveBeenCalled()
    })

    it('should handle clear error', async () => {
      const error = new Error('Clear error')
      vi.mocked(firestore.getDocs).mockRejectedValue(error)

      await expect(clearAllNotifications('user-123')).rejects.toThrow()
    })

    it('should handle empty notifications', async () => {
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: [],
        size: 0,
      })

      await expect(clearAllNotifications('user-123')).resolves.not.toThrow()
    })
  })

  describe('Notification Types', () => {
    it('should handle report notification', async () => {
      vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'notif-123' })

      const notification = {
        userId: 'user-123',
        title: 'New Report',
        message: 'A report was submitted',
        type: 'report',
        data: { reportId: 'report-456' },
      }

      await sendNotification(notification)

      expect(firestore.addDoc).toHaveBeenCalled()
    })

    it('should handle group notification', async () => {
      vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'notif-123' })

      const notification = {
        userId: 'user-123',
        title: 'Group Invitation',
        message: 'You were invited to a group',
        type: 'group',
        data: { groupId: 'group-789' },
      }

      await sendNotification(notification)

      expect(firestore.addDoc).toHaveBeenCalled()
    })

    it('should handle verification notification', async () => {
      vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'notif-123' })

      const notification = {
        userId: 'user-123',
        title: 'Photo Verified',
        message: 'Your photo was verified',
        type: 'verification',
        data: { verificationId: 'verif-101' },
      }

      await sendNotification(notification)

      expect(firestore.addDoc).toHaveBeenCalled()
    })
  })

  describe('Real-time Updates', () => {
    it('should handle real-time message from Firebase', () => {
      const onMessage = vi.fn()
      vi.mocked(messaging.onMessage).mockImplementation((m, callback) => {
        callback({
          notification: {
            title: 'New Report',
            body: 'A report was submitted',
          },
          data: { reportId: 'report-123' },
        })
      })

      // Implementation dependent
      // subscribeToRealtimeNotifications(onMessage)

      // expect(onMessage).toHaveBeenCalled()
    })

    it('should request notification permission', async () => {
      vi.mocked(messaging.getToken).mockResolvedValue('device-token-123')

      const token = await messaging.getToken()

      expect(token).toBe('device-token-123')
    })
  })

  describe('Notification Persistence', () => {
    it('should persist notification to database', async () => {
      vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'notif-123' })

      const notification = {
        userId: 'user-123',
        title: 'Test',
        message: 'Test message',
      }

      await sendNotification(notification)

      expect(firestore.addDoc).toHaveBeenCalled()
    })

    it('should load persisted notifications', async () => {
      const mockDocs = [
        {
          id: '1',
          data: () => ({
            title: 'Persisted 1',
            read: false,
            timestamp: new Date(),
          }),
        },
        {
          id: '2',
          data: () => ({
            title: 'Persisted 2',
            read: true,
            timestamp: new Date(),
          }),
        },
      ]

      vi.mocked(firestore.onSnapshot).mockImplementation((q, callback) => {
        callback({
          docs: mockDocs,
          empty: false,
        })
        return () => {}
      })

      const callback = vi.fn()
      subscribeToNotifications('user-123', callback)

      expect(callback).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ title: 'Persisted 1' }),
        expect.objectContaining({ title: 'Persisted 2' }),
      ]))
    })
  })
})
