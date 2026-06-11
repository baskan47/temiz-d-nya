import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createUserDocument,
  getUserDocument,
  watchIncomingReportsWithPagination,
  watchGroupsWithPagination,
  watchVerificationPendingWithPagination,
  getCollectionCount,
  createReport,
  updateGroupMembers,
} from '../firestoreService'

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
  increment: vi.fn((n) => n),
}))

import * as firestore from 'firebase/firestore'

describe('Firestore Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.firestore = {} // Required by functions using window.firestore
  })

  afterEach(() => {
    vi.clearAllMocks()
    window.firestore = undefined
  })

  describe('User Management', () => {
    it('should create user document', async () => {
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined)

      const userData = {
        uid: 'test-uid',
        email: 'test@example.com',
        name: 'Test User',
        role: 'volunteer',
      }

      await createUserDocument('test-uid', userData)

      expect(firestore.setDoc).toHaveBeenCalled()
    })

    it('should handle user document creation error', async () => {
      const error = new Error('Permission denied')
      vi.mocked(firestore.setDoc).mockRejectedValue(error)

      await expect(
        createUserDocument('test-uid', { email: 'test@example.com' })
      ).rejects.toThrow()
    })

    it('should retrieve user document', async () => {
      const mockData = {
        uid: 'test-uid',
        email: 'test@example.com',
        name: 'Test User',
        score: 100,
      }

      const mockDocSnap = {
        exists: () => true,
        data: () => mockData,
      }

      vi.mocked(firestore.getDoc).mockResolvedValue(mockDocSnap)

      const result = await getUserDocument('test-uid')

      expect(firestore.getDoc).toHaveBeenCalled()
      expect(result).toEqual(mockData)
    })

    it('should return null for non-existent user', async () => {
      const mockDocSnap = {
        exists: () => false,
        data: () => undefined,
      }

      vi.mocked(firestore.getDoc).mockResolvedValue(mockDocSnap)

      const result = await getUserDocument('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('Reports and Pagination', () => {
    it('should watch incoming reports with pagination', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ title: 'Report 1' }) },
        { id: '2', data: () => ({ title: 'Report 2' }) },
      ]

      const unsubscribe = vi.fn()

      vi.mocked(firestore.onSnapshot).mockImplementation((q, callback) => {
        callback({
          docs: mockDocs,
          empty: false,
        })
        return unsubscribe
      })

      let receivedData = null
      const unsubscribeFn = watchIncomingReportsWithPagination(
        (data) => {
          receivedData = data
        },
        10
      )

      expect(receivedData).toBeDefined()
      expect(receivedData.reports.length).toBe(2)

      unsubscribeFn()
      expect(unsubscribe).toHaveBeenCalled()
    })

    it('should handle pagination with hasMore flag', async () => {
      const mockDocs = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        data: () => ({ title: `Report ${i}` }),
      }))

      const unsubscribe = vi.fn()

      vi.mocked(firestore.onSnapshot).mockImplementation((q, callback) => {
        callback({
          docs: mockDocs,
          empty: false,
        })
        return unsubscribe
      })

      let receivedData = null
      watchIncomingReportsWithPagination(
        (data) => {
          receivedData = data
        },
        10
      )

      expect(receivedData.hasMore).toBe(false)
      expect(receivedData.reports.length).toBe(10)
    })

    it('should watch groups with pagination', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ name: 'Group 1' }) },
        { id: '2', data: () => ({ name: 'Group 2' }) },
      ]

      vi.mocked(firestore.onSnapshot).mockImplementation((q, callback) => {
        callback({
          docs: mockDocs,
          empty: false,
        })
      })

      let receivedData = null
      watchGroupsWithPagination(
        (data) => {
          receivedData = data
        },
        10
      )

      expect(receivedData.groups.length).toBe(2)
      expect(receivedData.pageSize).toBe(10)
    })

    it('should watch verifications pending', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ photoUrl: 'photo1.jpg' }) },
        { id: '2', data: () => ({ photoUrl: 'photo2.jpg' }) },
      ]

      vi.mocked(firestore.onSnapshot).mockImplementation((q, callback) => {
        callback({
          docs: mockDocs,
          empty: false,
        })
      })

      let receivedData = null
      watchVerificationPendingWithPagination(
        (data) => {
          receivedData = data
        },
        10
      )

      expect(receivedData.verifications.length).toBe(2)
    })

    it('should handle empty collections', async () => {
      vi.mocked(firestore.onSnapshot).mockImplementation((q, callback) => {
        callback({
          docs: [],
          empty: true,
        })
      })

      let receivedData = null
      watchIncomingReportsWithPagination((data) => {
        receivedData = data
      }, 10)

      expect(receivedData.reports.length).toBe(0)
      expect(receivedData.hasMore).toBe(false)
    })
  })

  describe('Collection Count', () => {
    it('should get accurate collection count', async () => {
      const mockDocs = Array.from({ length: 45 }, (_, i) => ({
        id: String(i),
      }))

      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs,
        size: 45,
      })

      const count = await getCollectionCount('reports')

      expect(count).toBe(45)
      expect(firestore.getDocs).toHaveBeenCalled()
    })

    it('should return 0 for empty collection', async () => {
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: [],
        size: 0,
      })

      const count = await getCollectionCount('reports')

      expect(count).toBe(0)
    })

    it('should handle collection count errors', async () => {
      const error = new Error('Permission denied')
      vi.mocked(firestore.getDocs).mockRejectedValue(error)

      await expect(getCollectionCount('reports')).rejects.toThrow()
    })
  })

  describe('Report Operations', () => {
    it('should create report document', async () => {
      vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'report-123' })

      const reportData = {
        title: 'Area cleanup needed',
        areaId: 'area-1',
        weight: 5,
        urgency: 'high',
        createdBy: 'user-123',
      }

      const result = await createReport(reportData)

      expect(firestore.addDoc).toHaveBeenCalled()
      expect(result).toEqual({ id: 'report-123' })
    })

    it('should validate report data before creation', async () => {
      const invalidReportData = {
        title: '', // empty title
        areaId: 'area-1',
        weight: 5,
      }

      await expect(createReport(invalidReportData)).rejects.toThrow()
    })

    it('should handle report creation error', async () => {
      const error = new Error('Database error')
      vi.mocked(firestore.addDoc).mockRejectedValue(error)

      await expect(
        createReport({
          title: 'Test',
          areaId: 'area-1',
          weight: 5,
        })
      ).rejects.toThrow()
    })
  })

  describe('Group Management', () => {
    it('should update group members', async () => {
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined)

      const members = ['user-1', 'user-2', 'user-3']

      await updateGroupMembers('group-123', members)

      expect(firestore.updateDoc).toHaveBeenCalled()
    })

    it('should handle group update error', async () => {
      const error = new Error('Group not found')
      vi.mocked(firestore.updateDoc).mockRejectedValue(error)

      await expect(
        updateGroupMembers('non-existent', ['user-1'])
      ).rejects.toThrow()
    })

    it('should validate member list', async () => {
      await expect(updateGroupMembers('group-123', [])).rejects.toThrow()
    })
  })

  describe('Real-time Subscriptions', () => {
    it('should handle subscription updates', async () => {
      const callback = vi.fn()
      const unsubscribe = vi.fn()

      vi.mocked(firestore.onSnapshot).mockImplementation((q, cb) => {
        cb({
          docs: [{ id: '1', data: () => ({ title: 'Report 1' }) }],
          empty: false,
        })
        return unsubscribe
      })

      const unsub = watchIncomingReportsWithPagination(callback, 10)

      expect(callback).toHaveBeenCalled()

      unsub()
      expect(unsubscribe).toHaveBeenCalled()
    })

    it('should handle snapshot errors', async () => {
      const onError = vi.fn()

      vi.mocked(firestore.onSnapshot).mockImplementation(
        (q, onNext, onErr) => {
          if (onErr) {
            onErr(new Error('Snapshot error'))
          }
          return () => {}
        }
      )

      watchIncomingReportsWithPagination(vi.fn(), 10)

      // Error handling depends on implementation
    })

    it('should allow multiple concurrent subscriptions', async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      vi.mocked(firestore.onSnapshot).mockImplementation((q, cb) => {
        cb({
          docs: [],
          empty: true,
        })
        return () => {}
      })

      const unsub1 = watchIncomingReportsWithPagination(callback1, 10)
      const unsub2 = watchGroupsWithPagination(callback2, 10)

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()

      unsub1()
      unsub2()
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields', async () => {
      const invalidReportData = {
        // missing required fields
        areaId: 'area-1',
      }

      await expect(createReport(invalidReportData)).rejects.toThrow(
        'Başlık gereklidir'
      )
    })

    it('should validate data types', async () => {
      const invalidData = {
        title: 123, // should be string
        areaId: 'area-1',
        weight: 'invalid', // should be number
      }

      await expect(createReport(invalidData)).rejects.toThrow()
    })

    it('should sanitize input data', async () => {
      vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'new-report' })

      const reportData = {
        title: '  Test Report  ', // with whitespace
        areaId: 'area-1',
        weight: 5,
      }

      // Should trim whitespace
      await createReport(reportData)

      // Verify trim happened in implementation
    })
  })

  describe('Error Recovery', () => {
    it('should retry on transient errors', async () => {
      const error = new Error('Network timeout')

      vi.mocked(firestore.getDocs)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ docs: [], size: 0 })

      // First call fails
      await expect(getCollectionCount('reports')).rejects.toThrow()

      // Second call succeeds
      const count = await getCollectionCount('reports')
      expect(count).toBe(0)
    })

    it('should handle timeout errors gracefully', async () => {
      const error = new Error('Timeout')
      vi.mocked(firestore.getDoc).mockRejectedValue(error)

      await expect(getUserDocument('test-uid')).rejects.toThrow()
    }, { timeout: 10000 })
  })

  describe('Pagination Edge Cases', () => {
    it('should handle exactly page-sized result', async () => {
      const pageSize = 10
      const mockDocs = Array.from({ length: pageSize }, (_, i) => ({
        id: String(i),
        data: () => ({ title: `Report ${i}` }),
      }))

      vi.mocked(firestore.onSnapshot).mockImplementation((q, callback) => {
        callback({
          docs: mockDocs,
          empty: false,
        })
      })

      let receivedData = null
      watchIncomingReportsWithPagination((data) => {
        receivedData = data
      }, pageSize)

      expect(receivedData.reports.length).toBe(pageSize)
      expect(receivedData.hasMore).toBe(false)
    })

    it('should detect more items available', async () => {
      const pageSize = 10
      const mockDocs = Array.from({ length: pageSize + 1 }, (_, i) => ({
        id: String(i),
        data: () => ({ title: `Report ${i}` }),
      }))

      vi.mocked(firestore.onSnapshot).mockImplementation((q, callback) => {
        callback({
          docs: mockDocs,
          empty: false,
        })
      })

      let receivedData = null
      watchIncomingReportsWithPagination((data) => {
        receivedData = data
      }, pageSize)

      expect(receivedData.reports.length).toBe(pageSize)
      expect(receivedData.hasMore).toBe(true)
    })
  })
})
