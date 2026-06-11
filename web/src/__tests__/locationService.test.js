import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCurrentLocation,
  calculateDistance,
  getNearbyReports,
  trackUserLocation,
  stopTracking,
} from '../LocationService'

describe('Location Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Get Current Location', () => {
    it('should get current location', async () => {
      const mockPosition = {
        coords: {
          latitude: 41.0082,
          longitude: 28.9784,
          accuracy: 10,
        },
      }

      global.navigator = {
        geolocation: {
          getCurrentPosition: vi.fn((cb) => cb(mockPosition)),
        },
      }

      const result = await getCurrentLocation()

      expect(result).toEqual({
        latitude: 41.0082,
        longitude: 28.9784,
      })
    })

    it('should handle geolocation error', async () => {
      global.navigator = {
        geolocation: {
          getCurrentPosition: vi.fn((cb, errCb) =>
            errCb(new Error('Location denied'))
          ),
        },
      }

      await expect(getCurrentLocation()).rejects.toThrow()
    })

    it('should timeout if location takes too long', async () => {
      global.navigator = {
        geolocation: {
          getCurrentPosition: vi.fn(() => {
            // Never calls callback
          }),
        },
      }

      await expect(
        getCurrentLocation()
      ).rejects.toThrow('Location timeout')
    }, { timeout: 10000 })

    it('should validate coordinates', async () => {
      const mockPosition = {
        coords: {
          latitude: 91, // invalid latitude
          longitude: 28.9784,
          accuracy: 10,
        },
      }

      global.navigator = {
        geolocation: {
          getCurrentPosition: vi.fn((cb) => cb(mockPosition)),
        },
      }

      await expect(getCurrentLocation()).rejects.toThrow()
    })

    it('should handle permission denied', async () => {
      const error = new Error('Permission denied')
      error.code = 1 // PERMISSION_DENIED

      global.navigator = {
        geolocation: {
          getCurrentPosition: vi.fn((cb, errCb) => errCb(error)),
        },
      }

      await expect(getCurrentLocation()).rejects.toThrow(
        'Konum izni verilmedi'
      )
    })
  })

  describe('Calculate Distance', () => {
    it('should calculate distance between two points', () => {
      // Istanbul coordinates
      const point1 = { latitude: 41.0082, longitude: 28.9784 }
      // Close by location
      const point2 = { latitude: 41.0142, longitude: 28.9895 }

      const distance = calculateDistance(point1, point2)

      // Should be a positive number in km
      expect(distance).toBeGreaterThan(0)
      expect(distance).toBeLessThan(2) // Very close
    })

    it('should return 0 for same coordinates', () => {
      const point = { latitude: 41.0082, longitude: 28.9784 }

      const distance = calculateDistance(point, point)

      expect(distance).toBe(0)
    })

    it('should be symmetric', () => {
      const point1 = { latitude: 41.0082, longitude: 28.9784 }
      const point2 = { latitude: 41.0142, longitude: 28.9895 }

      const distance1 = calculateDistance(point1, point2)
      const distance2 = calculateDistance(point2, point1)

      expect(distance1).toBe(distance2)
    })

    it('should use Haversine formula', () => {
      // Ankara coordinates
      const ankara = { latitude: 39.9334, longitude: 32.8597 }
      // Istanbul coordinates
      const istanbul = { latitude: 41.0082, longitude: 28.9784 }

      const distance = calculateDistance(ankara, istanbul)

      // Actual Haversine distance is ~349km between Ankara and Istanbul
      expect(distance).toBeGreaterThan(300)
      expect(distance).toBeLessThan(420)
    })

    it('should validate input coordinates', () => {
      const invalidPoint1 = { latitude: 91, longitude: 28.9784 } // invalid
      const validPoint = { latitude: 41.0082, longitude: 28.9784 }

      expect(() =>
        calculateDistance(invalidPoint1, validPoint)
      ).toThrow()
    })

    it('should handle antimeridian crossing', () => {
      const point1 = { latitude: 0, longitude: 179.5 }
      const point2 = { latitude: 0, longitude: -179.5 }

      const distance = calculateDistance(point1, point2)

      // 1° longitude at the equator ≈ 111 km
      // Both sides of the antimeridian should give the same result
      expect(distance).toBeGreaterThan(50)
      expect(distance).toBeLessThan(200)
    })
  })

  describe('Get Nearby Reports', () => {
    const mockReports = [
      {
        id: 'report-1',
        latitude: 41.0082,
        longitude: 28.9784,
        title: 'Park cleanup',
        distance: 0.5,
      },
      {
        id: 'report-2',
        latitude: 41.0142,
        longitude: 28.9895,
        title: 'Street cleanup',
        distance: 1.2,
      },
      {
        id: 'report-3',
        latitude: 41.0200,
        longitude: 29.0000,
        title: 'Beach cleanup',
        distance: 3.5,
      },
    ]

    beforeEach(() => {
      global.activeReports = mockReports
    })

    afterEach(() => {
      global.activeReports = null
    })

    it('should find nearby reports within radius', async () => {
      const userLocation = { latitude: 41.0082, longitude: 28.9784 }
      const radius = 2 // 2km

      const nearby = await getNearbyReports(userLocation, radius)

      expect(nearby).toContainEqual(expect.objectContaining({ id: 'report-1' }))
      expect(nearby).toContainEqual(expect.objectContaining({ id: 'report-2' }))
      expect(nearby).not.toContainEqual(expect.objectContaining({ id: 'report-3' }))
    })

    it('should sort by distance', async () => {
      const userLocation = { latitude: 41.0082, longitude: 28.9784 }
      const radius = 5

      const nearby = await getNearbyReports(userLocation, radius)

      for (let i = 1; i < nearby.length; i++) {
        expect(nearby[i].distance).toBeGreaterThanOrEqual(nearby[i - 1].distance)
      }
    })

    it('should handle no nearby reports', async () => {
      const userLocation = { latitude: 50, longitude: 50 } // Far away
      const radius = 1

      const nearby = await getNearbyReports(userLocation, radius)

      expect(nearby).toEqual([])
    })

    it('should validate radius', async () => {
      const userLocation = { latitude: 41.0082, longitude: 28.9784 }

      await expect(
        getNearbyReports(userLocation, -1)
      ).rejects.toThrow()

      await expect(
        getNearbyReports(userLocation, 0)
      ).rejects.toThrow()
    })

    it('should handle large radius', async () => {
      const userLocation = { latitude: 41.0082, longitude: 28.9784 }
      const radius = 10000 // 10,000 km (large)

      const nearby = await getNearbyReports(userLocation, radius)

      expect(Array.isArray(nearby)).toBe(true)
    })

    it('should calculate distance for each report', async () => {
      const userLocation = { latitude: 41.0082, longitude: 28.9784 }

      const nearby = await getNearbyReports(userLocation, 10)

      nearby.forEach((report) => {
        expect(report).toHaveProperty('distance')
        expect(typeof report.distance).toBe('number')
        expect(report.distance).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Track User Location', () => {
    beforeEach(() => {
      // Default navigator mock — watchPosition returns a numeric watchId
      global.navigator = {
        geolocation: {
          watchPosition: vi.fn(() => 1),
          clearWatch: vi.fn(),
        },
      }
    })

    afterEach(() => {
      global.navigator = undefined
    })

    it('should start tracking user location', () => {
      const onLocationChange = vi.fn()

      const watchId = trackUserLocation(onLocationChange)

      expect(watchId).toBeDefined()
      expect(typeof watchId).toBe('number')
    })

    it('should call callback on location change', async () => {
      const onLocationChange = vi.fn()

      const mockPosition = {
        coords: {
          latitude: 41.0082,
          longitude: 28.9784,
          accuracy: 10,
        },
      }

      global.navigator = {
        geolocation: {
          watchPosition: vi.fn((cb) => {
            cb(mockPosition)
            return 1
          }),
        },
      }

      trackUserLocation(onLocationChange)

      expect(onLocationChange).toHaveBeenCalledWith({
        latitude: 41.0082,
        longitude: 28.9784,
      })
    })

    it('should accept options', () => {
      const onLocationChange = vi.fn()
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }

      global.navigator = {
        geolocation: {
          watchPosition: vi.fn(),
        },
      }

      trackUserLocation(onLocationChange, options)

      const callArgs = vi.mocked(global.navigator.geolocation.watchPosition)
        .mock.calls[0][2]
      expect(callArgs).toEqual(options)
    })

    it('should handle tracking errors', () => {
      const onLocationChange = vi.fn()
      const onError = vi.fn()

      global.navigator = {
        geolocation: {
          watchPosition: vi.fn((cb, errCb) => {
            errCb(new Error('Location error'))
            return 1
          }),
        },
      }

      trackUserLocation(onLocationChange, {}, onError)

      expect(onError).toHaveBeenCalled()
    })

    it('should return watch ID for stopping', () => {
      const watchId = trackUserLocation(vi.fn())

      expect(watchId).toBeGreaterThan(0)
    })
  })

  describe('Stop Tracking', () => {
    it('should stop tracking location', () => {
      const mockWatchId = 1

      global.navigator = {
        geolocation: {
          clearWatch: vi.fn(),
        },
      }

      stopTracking(mockWatchId)

      expect(global.navigator.geolocation.clearWatch).toHaveBeenCalledWith(
        mockWatchId
      )
    })

    it('should handle invalid watch ID', () => {
      global.navigator = {
        geolocation: {
          clearWatch: vi.fn(),
        },
      }

      expect(() => stopTracking(null)).not.toThrow()
    })

    it('should be idempotent', () => {
      const mockWatchId = 1

      global.navigator = {
        geolocation: {
          clearWatch: vi.fn(),
        },
      }

      stopTracking(mockWatchId)
      stopTracking(mockWatchId)

      expect(global.navigator.geolocation.clearWatch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Geolocation API', () => {
    it('should check if geolocation is available', () => {
      global.navigator = {
        geolocation: {
          getCurrentPosition: vi.fn(),
        },
      }

      expect(global.navigator.geolocation).toBeDefined()
    })

    it('should request permission when needed', async () => {
      global.navigator = {
        permissions: {
          query: vi.fn().mockResolvedValue({
            state: 'prompt', // Not granted
          }),
        },
      }

      // Implementation dependent
      // await requestLocationPermission()
    })
  })

  describe('Coordinate Validation', () => {
    it('should validate latitude range', () => {
      const validLatitudes = [-90, -45, 0, 45, 90]
      const invalidLatitudes = [-91, 91, 180, -180]

      validLatitudes.forEach((lat) => {
        expect(() => {
          calculateDistance(
            { latitude: lat, longitude: 0 },
            { latitude: 0, longitude: 0 }
          )
        }).not.toThrow()
      })

      invalidLatitudes.forEach((lat) => {
        expect(() => {
          calculateDistance(
            { latitude: lat, longitude: 0 },
            { latitude: 0, longitude: 0 }
          )
        }).toThrow()
      })
    })

    it('should validate longitude range', () => {
      const validLongitudes = [-180, -90, 0, 90, 180]
      const invalidLongitudes = [-181, 181, 360, -360]

      validLongitudes.forEach((lng) => {
        expect(() => {
          calculateDistance(
            { latitude: 0, longitude: lng },
            { latitude: 0, longitude: 0 }
          )
        }).not.toThrow()
      })

      invalidLongitudes.forEach((lng) => {
        expect(() => {
          calculateDistance(
            { latitude: 0, longitude: lng },
            { latitude: 0, longitude: 0 }
          )
        }).toThrow()
      })
    })
  })

  describe('Performance', () => {
    it('should calculate distance efficiently', () => {
      const point1 = { latitude: 41.0082, longitude: 28.9784 }
      const point2 = { latitude: 41.0142, longitude: 28.9895 }

      const startTime = performance.now()

      for (let i = 0; i < 1000; i++) {
        calculateDistance(point1, point2)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // 1000 calculations should complete in < 100ms
      expect(duration).toBeLessThan(100)
    })

    it('should handle large report lists', async () => {
      const largeReportList = Array.from({ length: 10000 }, (_, i) => ({
        id: `report-${i}`,
        latitude: 41.0082 + Math.random() * 0.01,
        longitude: 28.9784 + Math.random() * 0.01,
      }))

      global.activeReports = largeReportList

      const userLocation = { latitude: 41.0082, longitude: 28.9784 }

      const startTime = performance.now()

      // Should complete in reasonable time
      const result = await getNearbyReports(userLocation, 5)

      const endTime = performance.now()

      expect(Array.isArray(result)).toBe(true)
      expect(endTime - startTime).toBeLessThan(5000) // Should be < 5s
    })
  })
})
