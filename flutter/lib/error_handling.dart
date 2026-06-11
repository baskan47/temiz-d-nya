/// ⚠️ Error Handling & Retry Utilities for Flutter
/// Network error recovery, exponential backoff

import 'dart:async';
import 'package:flutter/material.dart';

/// 🔄 Retry configuration
class RetryConfig {
  final int maxRetries;
  final Duration initialDelay;
  final Duration maxDelay;
  final double backoffMultiplier;
  final Duration timeout;

  const RetryConfig({
    this.maxRetries = 3,
    this.initialDelay = const Duration(milliseconds: 1000),
    this.maxDelay = const Duration(seconds: 30),
    this.backoffMultiplier = 2.0,
    this.timeout = const Duration(seconds: 10),
  });
}

/// 🔄 Retry with exponential backoff
Future<T> retryWithBackoff<T>(
  Future<T> Function() fn, {
  RetryConfig config = const RetryConfig(),
  int? maxRetries,
}) async {
  final totalAttempts = maxRetries != null ? maxRetries + 1 : config.maxRetries;
  Duration delay = config.initialDelay;
  dynamic lastError;

  for (int attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      print('Attempt $attempt/$totalAttempts');
      return await fn().timeout(config.timeout);
    } catch (error) {
      lastError = error;
      print('Attempt $attempt failed: $error');

      bool isRetryable = true;
      if (error is AppException) {
        isRetryable = error.isRetryable;
      } else if (error is TimeoutException) {
        isRetryable = true;
      }

      if (!isRetryable || attempt >= totalAttempts) {
        rethrow;
      }

      print('Retrying in ${delay.inMilliseconds}ms...');
      await Future.delayed(delay);
      
      // Calculate next delay
      final nextDelay = Duration(
        milliseconds: (delay.inMilliseconds * config.backoffMultiplier).toInt(),
      );
      delay = nextDelay.compareTo(config.maxDelay) > 0 ? config.maxDelay : nextDelay;
    }
  }

  throw lastError;
}

abstract class AppException implements Exception {
  final String message;
  final String code;
  AppException(this.message, this.code);
  bool get isRetryable;
}

/// 🔍 Custom Exception Classes
class NetworkException extends AppException {
  final int? statusCode;
  final dynamic originalError;
  final bool retryable;

  NetworkException(
    String message, {
    this.statusCode,
    this.originalError,
    this.retryable = true,
  }) : super(message, 'NETWORK_ERROR');

  @override
  bool get isRetryable => retryable;

  @override
  String toString() => 'NetworkException: $message (Status: $statusCode)';
}

class ValidationException extends AppException {
  final String? field;

  ValidationException(String message, {this.field}) : super(message, 'VALIDATION_ERROR');

  @override
  bool get isRetryable => false;

  @override
  String toString() => 'ValidationException: $message${field != null ? ' (Field: $field)' : ''}';
}

class AuthenticationException extends AppException {
  AuthenticationException(String message) : super(message, 'AUTH_ERROR');

  @override
  bool get isRetryable => false;

  @override
  String toString() => 'AuthenticationException: $message';
}

class FirestoreException extends AppException {
  final String code;
  final bool retryable;

  FirestoreException(
    String message, {
    this.code = 'unknown',
    this.retryable = false,
  }) : super(message, code);

  factory FirestoreException.fromError(dynamic error) {
    String code = 'unknown';
    String message = error.toString();

    if (error is FirebaseException) {
      code = error.code;
      message = error.message ?? message;
    }

    bool retryable = _isRetryableFirebaseCode(code);

    return FirestoreException(message, code: code, retryable: retryable);
  }

  @override
  bool get isRetryable => retryable;

  @override
  String toString() => 'FirestoreException: $message (Code: $code)';
}

bool _isRetryableFirebaseCode(String code) {
  const retryableCodes = [
    'network-request-failed',
    'internal-error',
    'service-unavailable',
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
  ];
  return retryableCodes.contains(code);
}

/// 🛡️ Safe Firestore operation with retry
Future<T> safeFirestoreOp<T>(
  Future<T> Function() fn, {
  int maxRetries = 3,
}) async {
  try {
    return await retryWithBackoff(
      fn,
      config: RetryConfig(maxRetries: maxRetries),
    );
  } catch (error) {
    throw FirestoreException.fromError(error);
  }
}

/// 📊 Error Logger
class ErrorLogger {
  static final List<ErrorRecord> errors = [];
  static const int maxErrors = 100;

  static ErrorRecord log(
    dynamic error, {
    Map<String, dynamic>? context,
    StackTrace? stackTrace,
  }) {
    final record = ErrorRecord(
      timestamp: DateTime.now(),
      name: _getErrorName(error),
      message: error.toString(),
      stack: stackTrace?.toString(),
      context: context ?? {},
    );

    errors.add(record);

    if (errors.length > maxErrors) {
      errors.removeAt(0);
    }

    print('[ERROR LOG] $record');
    return record;
  }

  static String _getErrorName(dynamic error) {
    if (error is NetworkException) return 'NetworkException';
    if (error is ValidationException) return 'ValidationException';
    if (error is AuthenticationException) return 'AuthenticationException';
    if (error is FirestoreException) return 'FirestoreException';
    return error.runtimeType.toString();
  }

  static List<ErrorRecord> getErrors() => [...errors];
  static void clearErrors() => errors.clear();
  static String exportErrors() => errors.map((e) => e.toString()).join('\n');
}

/// 📊 Error Record Model
class ErrorRecord {
  final DateTime timestamp;
  final String name;
  final String message;
  final String? stack;
  final Map<String, dynamic> context;

  ErrorRecord({
    required this.timestamp,
    required this.name,
    required this.message,
    this.stack,
    required this.context,
  });

  @override
  String toString() {
    return '''
ErrorRecord(
  Time: $timestamp
  Type: $name
  Message: $message
  Context: $context
)''';
  }
}

/// 🎯 Error Handler
class ErrorHandler {
  String getUserMessage(dynamic error) {
    return getErrorMessage(error);
  }

  static String getErrorMessage(dynamic error) {
    if (error is NetworkException) {
      return 'Ağ bağlantısı hatası: ${error.message}';
    } else if (error is ValidationException) {
      return error.message;
    } else if (error is AuthenticationException) {
      return 'Oturum süresi doldu. Lütfen tekrar giriş yapın.';
    } else if (error is FirestoreException) {
      return _getFirebaseErrorMessage(error.code);
    } else if (error is TimeoutException) {
      return 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.';
    }
    return 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }

  static void handle(
    dynamic error, {
    BuildContext? context,
    bool showSnackbar = true,
    bool logError = true,
    VoidCallback? onDismiss,
  }) {
    // Log error
    if (logError) {
      ErrorLogger.log(error);
    }

    // Show UI notification
    if (showSnackbar && context != null) {
      _showErrorSnackbar(context, error, onDismiss: onDismiss);
    }
  }

  static void _showErrorSnackbar(
    BuildContext context,
    dynamic error, {
    VoidCallback? onDismiss,
  }) {
    final message = getErrorMessage(error);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'Kapat',
          onPressed: onDismiss ?? () {},
        ),
      ),
    );
  }

  static String _getFirebaseErrorMessage(String code) {
    switch (code) {
      case 'permission-denied':
        return 'Bu işlem için yetkiniz yok.';
      case 'not-found':
        return 'Aradığınız veri bulunamadı.';
      case 'already-exists':
        return 'Bu veri zaten mevcut.';
      case 'network-request-failed':
        return 'Ağ bağlantısı başarısız oldu.';
      case 'service-unavailable':
        return 'Hizmet şu anda kullanılamıyor. Lütfen daha sonra deneyin.';
      default:
        return 'Firebase hatası oluştu. Lütfen daha sonra deneyin.';
    }
  }
}

/// 🌐 Network Connectivity Monitor
class ConnectivityMonitor {
  static bool _isOnline = true;
  static final List<VoidCallback> _listeners = [];

  static bool get isOnline => _isOnline;
  static List<VoidCallback> get listeners => _listeners;

  static void onConnectivityChanged(VoidCallback callback) {
    _listeners.add(callback);
  }

  static void notifyListeners() {
    for (var listener in _listeners) {
      listener.call();
    }
  }

  static void updateStatus(bool isOnline) {
    if (_isOnline != isOnline) {
      _isOnline = isOnline;
      notifyListeners();

      if (isOnline) {
        print('✅ Network status: ONLINE');
      } else {
        print('❌ Network status: OFFLINE');
      }
    }
  }
}

/// ⏱️ Timeout helper
class TimeoutExceptionWrapper extends AppException {
  TimeoutExceptionWrapper(String message) : super(message, 'TIMEOUT_ERROR');
  @override
  bool get isRetryable => true;
}

Future<T> withTimeout<T>(
  Future<T> future, {
  Duration timeout = const Duration(seconds: 10),
  String errorMessage = 'İşlem zaman aşımına uğradı',
}) {
  return future.timeout(
    timeout,
    onTimeout: () => throw TimeoutException(errorMessage, timeout),
  );
}

/// 🔄 Batch retry with partial failure handling
class BatchRetryResult<T> {
  final List<T> succeeded;
  final List<({dynamic error, int index})> failed;

  BatchRetryResult({
    required this.succeeded,
    required this.failed,
  });

  bool get hasFailures => failed.isNotEmpty;
  int get successRate => succeeded.length ~/ (succeeded.length + failed.length);
}

Future<BatchRetryResult<T>> batchRetryWithPartialFailure<T>(
  List<Future<T> Function()> operations, {
  int maxRetries = 3,
}) async {
  final succeeded = <T>[];
  final failed = <({dynamic error, int index})>[];

  for (int i = 0; i < operations.length; i++) {
    try {
      final result = await retryWithBackoff(
        operations[i],
        config: RetryConfig(maxRetries: maxRetries),
      );
      succeeded.add(result);
    } catch (error) {
      failed.add((error: error, index: i));
    }
  }

  return BatchRetryResult(succeeded: succeeded, failed: failed);
}

/// 🛡️ Safe operation wrapper
Future<T> safeOperation<T>(
  Future<T> Function() fn, {
  BuildContext? context,
  bool showError = true,
}) async {
  try {
    return await fn();
  } catch (error, stackTrace) {
    if (showError) {
      ErrorHandler.handle(
        error,
        context: context,
        logError: true,
      );
    } else {
      ErrorLogger.log(error, stackTrace: stackTrace);
    }
    rethrow;
  }
}

class FirebaseException extends AppException {
  final String code;
  final String message;

  FirebaseException({required this.code, required this.message}) : super(message, 'FIREBASE_ERROR');

  @override
  bool get isRetryable => true;

  @override
  String toString() => 'FirebaseException: $message (Code: $code)';
}
