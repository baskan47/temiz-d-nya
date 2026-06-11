import 'dart:convert';
import 'package:flutter/foundation.dart';

/// B2G (Business to Government) Veri Aktarım Altyapısı
/// Tehlikeli atıkların yerel yönetimlere standart bir yapıda iletilmesi için kullanılır.
class B2GExportService {
  
  /// Gelen bir bildirim verisini (Map olarak) standart resmi JSON formatına çevirir
  static String exportHazardousReportAsJson({
    required String reportId,
    required String reporterId,
    required double latitude,
    required double longitude,
    required String wasteType, // Tıbbi, Kimyasal vb.
    required String imageUrl,
    required DateTime timestamp,
  }) {
    // Resmi kurumlara uygun standart Payload yapısı
    final Map<String, dynamic> officialPayload = {
      "metadata": {
        "source_platform": "Temiz Dunya App",
        "api_version": "v1.0",
        "export_timestamp": DateTime.now().toUtc().toIso8601String(),
      },
      "incident": {
        "incident_id": reportId,
        "priority_level": _getPriorityLevel(wasteType),
        "waste_category": wasteType,
        "timestamp": timestamp.toUtc().toIso8601String(),
      },
      "location": {
        "latitude": latitude,
        "longitude": longitude,
        "crs": "WGS84",
      },
      "evidence": {
        "primary_image_url": imageUrl,
      },
      "reporter_info": {
        "anonymized_user_id": reporterId,
      }
    };

    final String jsonResult = jsonEncode(officialPayload);
    
    // Debugging için
    if (kDebugMode) {
      print("--- B2G JSON EXPORT ---");
      print(jsonResult);
    }
    
    return jsonResult;
  }

  /// Atık türüne göre aciliyet seviyesi belirler
  static String _getPriorityLevel(String wasteType) {
    switch (wasteType.toLowerCase()) {
      case 'tıbbi':
      case 'tibbi':
        return 'CRITICAL';
      case 'kimyasal':
      case 'toksik':
        return 'HIGH';
      case 'kesici':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  /// Gelecekte eklenebilecek PDF dışa aktarım taslağı
  static Future<void> exportAsPDF() async {
    // PDF paketleri kullanılarak, belediye antetli raporları oluşturulacak.
    throw UnimplementedError("PDF Export henüz uygulanmadı, JSON kullanın.");
  }
}
