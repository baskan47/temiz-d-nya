# 🧪 Testing Guide - Temiz Dünya

## 📋 Genel Bakış

Bu proje Web (React) ve Mobile (Flutter) tarafında unit testing'i destekler.

### Web Testing
- **Framework**: Vitest
- **Testing Library**: @testing-library/react
- **Coverage**: v8

### Flutter Testing
- **Framework**: Flutter test (built-in)
- **Package**: flutter_test

---

## 🚀 Web Tarafı Testing

### Setup

```bash
cd web
npm install
```

### Test Komutları

```bash
# Tüm testleri çalıştır
npm run test

# Watch mode (otomatik yeniden çalıştır)
npm run test:watch

# UI dashboard ile göster
npm run test:ui

# Coverage raporu oluştur
npm run test:coverage
```

### Test Dosya Yapısı

```
src/
├── __tests__/
│   ├── setup.js                 # Global setup
│   ├── validators.test.js       # Form validators
│   ├── errorHandling.test.js   # Error handling
│   └── imageOptimization.test.js # Image utils
├── validators.js
├── errorHandling.js
└── imageOptimization.js
```

### Test Yazma

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validators } from '../../validators'

describe('Email Validator', () => {
  it('should accept valid email', () => {
    const error = validators.email('test@example.com')
    expect(error).toBeNull()
  })

  it('should reject invalid email', () => {
    const error = validators.email('invalid')
    expect(error).toBe('Geçerli bir email girin')
  })
})
```

### Mocking

```javascript
// Firebase mocking
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
}))

// Async function mocking
const mockFn = vi.fn().mockResolvedValue('success')
```

### Coverage Hedefleri

```
Minimum Coverage Requirements:
- Lines: 50%
- Functions: 50%
- Branches: 50%
- Statements: 50%
```

**Hedef**: ~80% coverage

---

## 📱 Flutter Tarafı Testing

### Setup

```bash
cd flutter
flutter pub get
```

### Test Komutları

```bash
# Tüm testleri çalıştır
flutter test

# Belirli test dosyası
flutter test test/widget_test_extended.dart

# Coverage ile birlikte
flutter test --coverage

# Watch mode
flutter test --watch
```

### Test Dosya Yapısı

```
test/
├── app_test.dart              # Main app tests
├── widget_test.dart           # Widget tests
├── integration_test.dart      # Integration tests
└── widget_test_extended.dart  # Extended tests
```

### Widget Test Örneği

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:purdunya_flutter_osm/main.dart';

void main() {
  group('AuthScreen Tests', () => {
    testWidgets('Email field accepts input', (WidgetTester tester) async {
      await tester.pumpWidget(PurDunyaApp());
      
      // Find email field
      final emailField = find.byType(TextField).first;
      
      // Enter text
      await tester.enterText(emailField, 'test@example.com');
      await tester.pumpWidget(PurDunyaApp());
      
      // Verify
      expect(find.text('test@example.com'), findsOneWidget);
    });
  });
}
```

### Integration Test Örneği

```dart
import 'package:integration_test/integration_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purdunya_flutter_osm/main.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Full app integration tests', () => {
    testWidgets('User registration flow', (WidgetTester tester) async {
      app.main();
      
      // Simulate full user registration
      await tester.pumpAndSettle();
      // ... test steps
    });
  });
}
```

---

## 📊 Coverage Raporu

### Web Coverage Görüntüleme

```bash
npm run test:coverage

# HTML rapor oluşturur
# coverage/index.html dosyasında görüntüleyin
```

### Flutter Coverage

```bash
flutter test --coverage

# coverage/lcov.info dosyası oluşturulur
# genhtml ile görüntüleyin:
# genhtml -o coverage/html coverage/lcov.info
```

---

## ✅ Test Checklist

- [ ] Validators tüm edge case'leri kapsıyor
- [ ] Error handling testleri retry logic'i doğruluyor
- [ ] Image optimization compression doğru çalışıyor
- [ ] Authentication flow tamamlandı
- [ ] Pagination sonuç verme doğru
- [ ] Firestore Security Rules enforced
- [ ] Network error recovery testlendi
- [ ] User input validation kapsamlı

---

## 🐛 Common Test Issues

### Mock Error: "Firebase is not defined"
```javascript
// solution:
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  // ... other methods
}))
```

### Async Timeout
```javascript
// Increase timeout:
it('should load data', async () => {
  // ...
}, { timeout: 10000 })
```

### Flutter Widget Not Found
```dart
// Use find with correct matchers:
find.byType(TextField)
find.byKey(Key('emailField'))
find.byWidgetPredicate((w) => w is TextFormField)
```

---

## 📚 Kaynaklar

### Web
- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/react)
- [Jest Cheat Sheet](https://jestjs.io/docs/getting-started)

### Flutter
- [Flutter Testing](https://flutter.dev/docs/testing)
- [Integration Testing](https://flutter.dev/docs/testing/integration-tests)
- [Widget Testing](https://flutter.dev/docs/testing/widgets)

---

## 🎯 Test Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **Descriptive Names**: Test adları ne test ettiklerini açıkça söylemeli
3. **Single Responsibility**: Bir test bir şey test etmeli
4. **DRY**: beforeEach/beforeAll kullanarak tekrarı önle
5. **Mock External**: External dependencies'i mock et
6. **Fast Tests**: Testler hızlı olmalı
7. **Isolated**: Testler birbirinden bağımsız olmalı
8. **Coverage**: %80+ coverage hedefle

---

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  web-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd web && npm install
      - run: npm run test
      - run: npm run test:coverage

  flutter-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - run: cd flutter && flutter pub get
      - run: flutter test
```

---

## 📞 Support

Test sorularınız için:
1. Docs'ları kontrol edin
2. Existing test'lere bakın
3. Framework documentation'ına gözatın
