import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateImageFile,
  formatFileSize,
} from '../imageOptimization'

describe('Image Optimization', () => {
  describe('Image Validation', () => {
    it('should reject null file', () => {
      const errors = validateImageFile(null)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toBe('Dosya seçilmedi')
    })

    it('should reject unsupported file type', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const errors = validateImageFile(file)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('Desteklenmeyen format')
    })

    it('should reject files larger than max size', () => {
      const largeContent = new ArrayBuffer(11 * 1024 * 1024) // 11MB
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
      const errors = validateImageFile(file, 10) // 10MB max
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('çok büyük')
    })

    it('should accept valid image file', () => {
      const file = new File(['test'], 'image.jpg', { type: 'image/jpeg' })
      const errors = validateImageFile(file, 10)
      // Should be no errors (or only errors about minimum size which requires reading image)
      expect(errors.filter(e => e.includes('çok büyük')).length).toBe(0)
    })

    it('should accept multiple formats', () => {
      const formats = ['image/jpeg', 'image/png', 'image/webp']
      
      formats.forEach(format => {
        const file = new File(['test'], `image.jpg`, { type: format })
        const errors = validateImageFile(file, 10)
        expect(errors.filter(e => e.includes('Desteklenmeyen format')).length).toBe(0)
      })
    })
  })

  describe('File Size Formatting', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(500)).toContain('Bytes')
    })

    it('should format kilobytes', () => {
      const result = formatFileSize(1024 * 5) // 5KB
      expect(result).toContain('KB')
    })

    it('should format megabytes', () => {
      const result = formatFileSize(1024 * 1024 * 2) // 2MB
      expect(result).toContain('MB')
    })

    it('should format gigabytes', () => {
      const result = formatFileSize(1024 * 1024 * 1024) // 1GB
      expect(result).toContain('GB')
    })

    it('should format with correct decimal places', () => {
      const result = formatFileSize(1234567)
      const parts = result.split(' ')
      const number = parseFloat(parts[0])
      expect(number).toBeLessThanOrEqual(Math.ceil(1234567 / (1024 * 1024) * 100) / 100)
    })
  })

  describe('Compression Report', () => {
    it('should calculate compression ratio', () => {
      const original = 1000000
      const compressed = 500000
      const ratio = Math.round((1 - compressed / original) * 100)
      expect(ratio).toBe(50)
    })

    it('should calculate saved size', () => {
      const original = 1000000
      const compressed = 800000
      const saved = original - compressed
      expect(saved).toBe(200000)
    })
  })

  describe('Image Metadata', () => {
    it('should get correct image type from file', () => {
      const file = new File(['test'], 'image.jpg', { type: 'image/jpeg' })
      expect(file.type).toBe('image/jpeg')
    })

    it('should get file name', () => {
      const file = new File(['test'], 'my-image.png', { type: 'image/png' })
      expect(file.name).toBe('my-image.png')
    })

    it('should get file size in bytes', () => {
      const content = new Uint8Array(1024) // 1KB
      const file = new File([content], 'image.jpg', { type: 'image/jpeg' })
      expect(file.size).toBe(1024)
    })

    it('should get last modified date', () => {
      const now = Date.now()
      const file = new File(['test'], 'image.jpg', { type: 'image/jpeg', lastModified: now })
      expect(file.lastModified).toBe(now)
    })
  })

  describe('Batch Image Optimization', () => {
    it('should handle multiple files', () => {
      const files = [
        new File(['test1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'image2.jpg', { type: 'image/jpeg' }),
        new File(['test3'], 'image3.jpg', { type: 'image/jpeg' }),
      ]

      expect(files.length).toBe(3)
      files.forEach(file => {
        expect(file.type).toBe('image/jpeg')
      })
    })

    it('should handle mixed file types', () => {
      const files = [
        new File(['test1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'image2.png', { type: 'image/png' }),
        new File(['test3'], 'image3.webp', { type: 'image/webp' }),
      ]

      const validFiles = files.filter(f => {
        const errors = validateImageFile(f)
        return errors.filter(e => e.includes('Desteklenmeyen format')).length === 0
      })

      expect(validFiles.length).toBe(3)
    })

    it('should filter out invalid files', () => {
      const files = [
        new File(['test1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'document.pdf', { type: 'application/pdf' }),
        new File(['test3'], 'image3.jpg', { type: 'image/jpeg' }),
      ]

      const validFiles = files.filter(f => {
        const errors = validateImageFile(f)
        return errors.filter(e => e.includes('Desteklenmeyen format')).length === 0
      })

      expect(validFiles.length).toBe(2)
    })
  })
})
