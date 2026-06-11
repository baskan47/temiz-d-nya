/**
 * ⚠️ Error Handling & Retry Utilities
 * Network error recovery, exponential backoff
 */

/**
 * 🔄 Retry configuration
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  timeoutMs: 10000,
};

/**
 * 🔄 Exponential backoff retry function
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Function result
 */
export async function retryWithBackoff(fn, options = {}) {
  const config = { ...RETRY_CONFIG, ...options };
  let lastError;
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${config.maxRetries}`);
      return await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), config.timeoutMs)
        ),
      ]);
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);

      if (attempt < config.maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
      }
    }
  }

  throw lastError;
}

/**
 * 💤 Sleep utility
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 🔍 Custom Error Classes
 */
export class NetworkError extends Error {
  constructor(message, status, originalError) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.originalError = originalError;
    this.retryable = status >= 408 && status !== 429 && status < 500 || status >= 500;
  }
}

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.retryable = false;
  }
}

export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.retryable = false;
  }
}

export class FirebaseError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FirebaseError';
    this.code = code;
    this.retryable = isRetryableFirebaseError(code);
  }
}

/**
 * Check if Firebase error is retryable
 */
function isRetryableFirebaseError(code) {
  const retryableCodes = [
    'network-request-failed',
    'internal-error',
    'service-unavailable',
    'timeout',
    'too-many-requests',
  ];
  return retryableCodes.includes(code);
}

/**
 * 🛡️ Safe API call wrapper
 */
export async function safeApiCall(fn, errorHandler = null) {
  try {
    return await fn();
  } catch (error) {
    console.error('API call failed:', error);
    
    if (errorHandler) {
      errorHandler(error);
    }
    
    throw error;
  }
}

/**
 * 🛡️ Safe Firestore operation with retry
 */
export async function safeFirestoreOp(fn, options = {}) {
  try {
    return await retryWithBackoff(fn, {
      maxRetries: options.maxRetries || 3,
      initialDelayMs: options.initialDelayMs || 500,
    });
  } catch (error) {
    console.error('Firestore operation failed:', error);
    throw new FirebaseError(error.message, error.code);
  }
}

/**
 * 📊 Error Logger
 */
export class ErrorLogger {
  static errors = [];

  static log(error, context = {}) {
    const errorRecord = {
      timestamp: new Date().toISOString(),
      name: error.name || 'Unknown',
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.errors.push(errorRecord);

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors.shift();
    }

    console.error('[ERROR LOG]', errorRecord);
    return errorRecord;
  }

  static getErrors() {
    return this.errors;
  }

  static clearErrors() {
    this.errors = [];
  }

  static exportErrors() {
    return JSON.stringify(this.errors, null, 2);
  }
}

/**
 * 🌐 Network status monitor
 */
export class NetworkMonitor {
  static isOnline = navigator.onLine;
  static listeners = [];

  static {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
      console.log('✅ Network status: ONLINE');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
      console.error('❌ Network status: OFFLINE');
    });
  }

  static onStatusChange(callback) {
    this.listeners.push(callback);
  }

  static notifyListeners(isOnline) {
    this.listeners.forEach((callback) => callback(isOnline));
  }

  static async checkConnection(timeout = 5000) {
    try {
      const response = await Promise.race([
        fetch(new Request('https://www.google.com', { method: 'HEAD', mode: 'no-cors' })),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
      ]);
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * 🎯 Error Handler Middleware
 */
export class ErrorHandler {
  static handle(error, options = {}) {
    const {
      showNotification = true,
      logError = true,
      throwError = true,
    } = options;

    // Log error
    if (logError) {
      ErrorLogger.log(error, options.context);
    }

    // Show user notification
    if (showNotification) {
      this.showUserNotification(error);
    }

    // Throw or swallow
    if (throwError) {
      throw error;
    }

    return error;
  }

  static showUserNotification(error) {
    let message = 'Bir hata oluştu. Lütfen tekrar deneyin.';

    if (error instanceof NetworkError) {
      message = `Ağ bağlantısı hatası (${error.status})`;
    } else if (error instanceof ValidationError) {
      message = error.message;
    } else if (error instanceof AuthenticationError) {
      message = 'Oturum süresi doldu. Lütfen tekrar giriş yapın.';
    } else if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'permission-denied':
          message = 'Bu işlem için yetkiniz yok.';
          break;
        case 'not-found':
          message = 'Aradığınız veri bulunamadı.';
          break;
        case 'already-exists':
          message = 'Bu veri zaten mevcut.';
          break;
        default:
          message = `Firebase hatası: ${error.message}`;
      }
    }

    // Emit custom event for UI to show notification
    const event = new CustomEvent('app:error', {
      detail: { message, error },
    });
    window.dispatchEvent(event);
  }
}

/**
 * 📋 Batch Retry Handler
 */
export async function batchRetryWithPartialFailure(operations, maxRetries = 3) {
  const results = {
    succeeded: [],
    failed: [],
  };

  for (const op of operations) {
    try {
      const result = await retryWithBackoff(() => op.fn(), { maxRetries });
      results.succeeded.push({ ...op, result });
    } catch (error) {
      results.failed.push({ ...op, error });
    }
  }

  return results;
}

/**
 * ⏱️ Timeout wrapper
 */
export function withTimeout(promise, timeoutMs = 10000, errorMessage = 'İşlem zaman aşımına uğradı') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}
