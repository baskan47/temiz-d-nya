/**
 * 🖼️ Image Optimization Utilities
 * Compression, resizing, format conversion for web
 */

/**
 * 📊 Compress image using Canvas API
 * @param {File} file - Image file
 * @param {number} maxWidth - Max width in pixels
 * @param {number} maxHeight - Max height in pixels
 * @param {number} quality - Compression quality (0-1)
 * @returns {Promise<Blob>} Compressed image blob
 */
export async function compressImage(
  file,
  maxWidth = 1200,
  maxHeight = 800,
  quality = 0.8
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/webp', // Use WebP format for better compression
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * 📊 Convert image to WebP format
 * @param {File} file - Image file
 * @param {number} quality - Quality (0-1)
 * @returns {Promise<Blob>} WebP blob
 */
export async function convertToWebP(file, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => resolve(blob),
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * 📊 Create thumbnail from image
 * @param {File} file - Image file
 * @param {number} size - Thumbnail size (width = height)
 * @param {number} quality - Quality (0-1)
 * @returns {Promise<Blob>} Thumbnail blob
 */
export async function createThumbnail(file, size = 150, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate crop to make square
        const min = Math.min(img.width, img.height);
        const x = (img.width - min) / 2;
        const y = (img.height - min) / 2;

        ctx.drawImage(img, x, y, min, min, 0, 0, size, size);

        canvas.toBlob(
          (blob) => resolve(blob),
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * 📊 Get image metadata
 */
export function getImageMetadata(file) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    sizeMB: (file.size / (1024 * 1024)).toFixed(2),
    lastModified: new Date(file.lastModified).toLocaleString(),
  };
}

/**
 * 📊 Validate image file
 */
export function validateImageFile(file, maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) {
  const errors = [];

  if (!file) {
    errors.push('Dosya seçilmedi');
    return errors;
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Desteklenmeyen format. İzin verilen: ${allowedTypes.join(', ')}`);
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    errors.push(`Dosya çok büyük. Max: ${maxSizeMB}MB, Aktual: ${fileSizeMB.toFixed(2)}MB`);
  }

  // Check minimum size (at least 100x100)
  // This would require reading the image, so it's done separately

  return errors;
}

/**
 * 📊 Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 📊 Compress multiple images
 */
export async function compressImages(files, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 800,
    quality = 0.8,
    createThumb = true,
    thumbSize = 150,
  } = options;

  const results = [];

  for (const file of files) {
    try {
      const validation = validateImageFile(file);
      if (validation.length > 0) {
        results.push({
          file: file.name,
          error: validation.join('; '),
        });
        continue;
      }

      // Compress main image
      const compressed = await compressImage(file, maxWidth, maxHeight, quality);

      const result = {
        file: file.name,
        original: file.size,
        compressed: compressed.size,
        compressionRatio: Math.round((1 - compressed.size / file.size) * 100),
        blob: compressed,
        compressedDataUrl: null,
      };

      // Get data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        result.compressedDataUrl = e.target?.result;
      };
      reader.readAsDataURL(compressed);

      // Create thumbnail if requested
      if (createThumb) {
        const thumb = await createThumbnail(file, thumbSize);
        result.thumbnail = thumb;
      }

      results.push(result);
    } catch (e) {
      results.push({
        file: file.name,
        error: e.message,
      });
    }
  }

  return results;
}

/**
 * 📊 Image optimization report
 */
export function generateOptimizationReport(results) {
  const successful = results.filter((r) => !r.error);
  const failed = results.filter((r) => r.error);

  const totalOriginal = successful.reduce((sum, r) => sum + r.original, 0);
  const totalCompressed = successful.reduce((sum, r) => sum + r.compressed, 0);
  const avgCompression = successful.length > 0
    ? Math.round(
        successful.reduce((sum, r) => sum + r.compressionRatio, 0) /
          successful.length
      )
    : 0;

  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    originalSize: formatFileSize(totalOriginal),
    compressedSize: formatFileSize(totalCompressed),
    savedSize: formatFileSize(totalOriginal - totalCompressed),
    avgCompressionRatio: avgCompression,
    details: results,
  };
}
