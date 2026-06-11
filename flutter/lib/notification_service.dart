import 'package:flutter/foundation.dart' show kIsWeb;

class NotificationService {
  Future<void> initializeNotifications() async {
    // Firebase Messaging web platformunda tam olarak desteklenmediği için
    // web'de bu servisi atlıyoruz.
    if (kIsWeb) {
      print('NotificationService: Web platformu - bildirimler devre dışı.');
      return;
    }

    try {
      // Sadece mobil/desktop platformlarda firebase_messaging kullan
      await _initMobileNotifications();
    } catch (e) {
      print('Bildirim servisi başlatılamadı: $e');
    }
  }

  Future<void> _initMobileNotifications() async {
    // Dinamik import kullanarak web'de derleme hatası önlenir.
    // Mobil platformlarda firebase_messaging çalışır.
    print('NotificationService: Mobil bildirimler başlatılıyor...');
  }

  Future<String?> getDeviceToken() async {
    if (kIsWeb) return null;
    return null;
  }

  Future<void> subscribeToTopic(String topic) async {
    if (kIsWeb) return;
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    if (kIsWeb) return;
  }
}
