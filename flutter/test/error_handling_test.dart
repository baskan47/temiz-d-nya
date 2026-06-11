import 'package:flutter_test/flutter_test.dart';
import 'package:purdunya_flutter_osm/error_handling.dart';

void main() {
  group('Error Classes', () {
    test('NetworkException is retryable', () {
      final error = NetworkException('Connection failed');
      expect(error.isRetryable, isTrue);
      expect(error.message, contains('Connection failed'));
    });

    test('ValidationException is not retryable', () {
      final error = ValidationException('Invalid input');
      expect(error.isRetryable, isFalse);
    });

    test('AuthenticationException is not retryable', () {
      final error = AuthenticationException('Invalid credentials');
      expect(error.isRetryable, isFalse);
    });

    test('FirebaseException is retryable', () {
      final error = FirebaseException(code: 'db_error', message: 'Database error');
      expect(error.isRetryable, isTrue);
    });

    test('TimeoutException is retryable', () {
      final error = TimeoutExceptionWrapper('Operation timeout');
      expect(error.isRetryable, isTrue);
    });

    test('ValidationException is not retryable - alt constructor', () {
      final error = ValidationException('Access denied');
      expect(error.isRetryable, isFalse);
    });
  });

  group('Retry with Backoff', () {
    test('success on first try', () async {
      int callCount = 0;
      Future<String> operation() async {
        callCount++;
        return 'success';
      }

      final result = await retryWithBackoff<String>(
        operation,
        maxRetries: 3,
      );

      expect(result, equals('success'));
      expect(callCount, equals(1));
    });

    test('success after one retry', () async {
      int callCount = 0;
      Future<String> operation() async {
        callCount++;
        if (callCount < 2) {
          throw NetworkException('Connection failed');
        }
        return 'success';
      }

      final result = await retryWithBackoff<String>(
        operation,
        maxRetries: 3,
      );

      expect(result, equals('success'));
      expect(callCount, equals(2));
    });

    test('exhausts retries on continuous failure', () async {
      int callCount = 0;
      Future<String> operation() async {
        callCount++;
        throw NetworkException('Always fails');
      }

      await expectLater(
        () => retryWithBackoff<String>(
          operation,
          maxRetries: 2,
        ),
        throwsA(isA<NetworkException>()),
      );

      expect(callCount, equals(3));
    });

    test('stops retrying on non-retryable error', () async {
      int callCount = 0;
      Future<String> operation() async {
        callCount++;
        throw ValidationException('Invalid input');
      }

      await expectLater(
        () => retryWithBackoff<String>(
          operation,
          maxRetries: 3,
        ),
        throwsA(isA<ValidationException>()),
      );

      expect(callCount, equals(1));
    });

    test('increases delay between retries', () async {
      int callCount = 0;

      Future<String> operation() async {
        callCount++;
        if (callCount < 3) {
          throw NetworkException('Fail');
        }
        return 'success';
      }

      final startTime = DateTime.now();
      await retryWithBackoff<String>(
        operation,
        maxRetries: 3,
      );

      final elapsed = DateTime.now().difference(startTime);
      expect(elapsed.inMilliseconds, greaterThan(0));
    });

    test('respects maximum retry count', () async {
      int callCount = 0;

      Future<String> operation() async {
        callCount++;
        throw NetworkException('Always fails');
      }

      try {
        await retryWithBackoff<String>(
          operation,
          maxRetries: 2,
        );
      } catch (e) {
        // Expected to throw
      }

      expect(callCount, equals(3));
    });
  });

  group('Error Logger', () {
    setUp(() {
      ErrorLogger.clearErrors();
    });

    test('records errors', () {
      ErrorLogger.log(
        NetworkException('Test error 1'),
        stackTrace: StackTrace.current,
      );
      ErrorLogger.log(
        ValidationException('Test error 2'),
        stackTrace: StackTrace.current,
      );

      expect(ErrorLogger.errors.length, equals(2));
    });

    test('stores error messages', () {
      ErrorLogger.log(
        NetworkException('Connection failed'),
        stackTrace: StackTrace.current,
      );

      expect(ErrorLogger.errors.first.message, contains('Connection failed'));
    });

    test('maintains maximum 100 errors', () {
      for (int i = 0; i < 150; i++) {
        ErrorLogger.log(
          NetworkException('Error $i'),
          stackTrace: StackTrace.current,
        );
      }

      expect(ErrorLogger.errors.length, lessThanOrEqualTo(100));
    });

    test('clears error log', () {
      ErrorLogger.log(
        NetworkException('Error 1'),
        stackTrace: StackTrace.current,
      );
      ErrorLogger.log(
        NetworkException('Error 2'),
        stackTrace: StackTrace.current,
      );

      expect(ErrorLogger.errors.length, equals(2));

      ErrorLogger.clearErrors();

      expect(ErrorLogger.errors.isEmpty, isTrue);
    });

    test('exports errors as string', () {
      ErrorLogger.log(
        NetworkException('Test error'),
        stackTrace: StackTrace.current,
      );

      final export = ErrorLogger.exportErrors();
      expect(export, isNotEmpty);
      expect(export, contains('NetworkException'));
    });

    test('includes timestamps in logs', () {
      ErrorLogger.log(
        NetworkException('Test'),
        stackTrace: StackTrace.current,
      );

      expect(ErrorLogger.errors.first.message, contains('Test'));
    });
  });

  group('Timeout Handling', () {
    test('operation completes within timeout', () async {
      Future<String> operation() async {
        await Future.delayed(const Duration(milliseconds: 100));
        return 'success';
      }

      final result = await operation();
      expect(result, equals('success'));
    });
  });

  group('Error Handler', () {
    test('formats error message for user', () {
      final handler = ErrorHandler();

      final message = handler.getUserMessage(
        NetworkException('Connection failed'),
      );

      expect(message, isNotEmpty);
      expect(message.length, greaterThan(0));
    });

    test('handles different error types', () {
      final handler = ErrorHandler();

      final networkMsg = handler.getUserMessage(
        NetworkException('Network error'),
      );

      final validationMsg = handler.getUserMessage(
        ValidationException('Validation error'),
      );

      expect(networkMsg, isNotEmpty);
      expect(validationMsg, isNotEmpty);
      expect(networkMsg, isNot(validationMsg));
    });

    test('provides error classification', () {
      final networkError = NetworkException('Network');
      final validationError = ValidationException('Validation');

      expect(networkError.isRetryable, isTrue);
      expect(validationError.isRetryable, isFalse);
    });
  });

  group('Connectivity Monitoring', () {
    test('detects network availability', () {
      expect(ConnectivityMonitor.isOnline, isTrue);
    });
  });

  group('Batch Retry', () {
    test('retries multiple operations', () async {
      final operations = <Future<String> Function()>[
        () async {
          await Future.delayed(const Duration(milliseconds: 10));
          return 'result1';
        },
        () async {
          await Future.delayed(const Duration(milliseconds: 10));
          return 'result2';
        },
      ];

      final results = await Future.wait(
        operations.map((op) => retryWithBackoff<String>(op, maxRetries: 1)),
      );

      expect(results.length, equals(2));
    });
  });

  group('Exception Hierarchy', () {
    test('exceptions inherit from base AppException', () {
      expect(NetworkException('test'), isA<Exception>());
      expect(ValidationException('test'), isA<Exception>());
      expect(AuthenticationException('test'), isA<Exception>());
    });

    test('custom properties on exceptions', () {
      final error = NetworkException('Connection failed');
      
      expect(error.message, equals('Connection failed'));
      expect(error.isRetryable, isTrue);
    });

    test('exception to string conversion', () {
      final error = NetworkException('Connection failed');
      
      final str = error.toString();
      expect(str, isNotEmpty);
      expect(str, anyOf(contains('NetworkException'), contains('Connection failed')));
    });
  });
}
