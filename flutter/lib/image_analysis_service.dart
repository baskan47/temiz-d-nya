import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/material.dart' show Color;
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

// ─────────────────────────────────────────────────────────────────────────────
// Konfigürasyon
// ─────────────────────────────────────────────────────────────────────────────
class AnalysisConfig {
  /// Gerçek Gemini API key'inizi buraya girin.
  /// Boş bırakırsanız sistem otomatik olarak mock moda geçer.
  static const String geminiApiKey = '';

  /// Eşik değerleri
  static const double dirtyThreshold = 0.70; // > 0.70 → doğrulanmış kirli
  static const double cleanThreshold = 0.20; // < 0.20 → temiz/sahte

  /// Gemini model
  static const String model = 'gemini-1.5-flash-latest';

  /// Maksimum görüntü boyutu (byte)
  static const int maxImageBytes = 19 * 1024 * 1024; // 19MB (Gemini 1.5 Flash limit)

  static bool get useMock => geminiApiKey.isEmpty;
}

// ─────────────────────────────────────────────────────────────────────────────
// Veri Modelleri
// ─────────────────────────────────────────────────────────────────────────────
enum AnalysisVerdict {
  verifiedDirty, // dirtyScore > 0.70 → haritaya ekle
  likelyDirty,   // 0.50 – 0.70   → haritaya ekle (düşük öncelik)
  uncertain,     // 0.20 – 0.50   → admin kuyruğu
  rejectedClean, // < 0.20        → reddet
}

enum AnalysisType {
  dirtyReport,    // Kullanıcı kirli alan bildiriyor
  cleanEvidence,  // Grup temizleme kanıtı yüklüyor
}

class AnalysisFlags {
  final bool isOutdoor;
  final bool hasHuman;
  final bool isWaterBody;
  final bool isHazardous;
  final bool isBeforeAfterMatch;

  const AnalysisFlags({
    this.isOutdoor = true,
    this.hasHuman = false,
    this.isWaterBody = false,
    this.isHazardous = false,
    this.isBeforeAfterMatch = false,
  });

  Map<String, dynamic> toMap() => {
    'isOutdoor': isOutdoor,
    'hasHuman': hasHuman,
    'isWaterBody': isWaterBody,
    'isHazardous': isHazardous,
    'isBeforeAfterMatch': isBeforeAfterMatch,
  };
}

class WasteCategories {
  final double plastic;
  final double organic;
  final double glass;
  final double metal;
  final double hazardous; // Yeni: Tehlikeli atık (pil, yağ vb.)
  final double other;

  const WasteCategories({
    this.plastic = 0,
    this.organic = 0,
    this.glass = 0,
    this.metal = 0,
    this.hazardous = 0,
    this.other = 0,
  });

  Map<String, dynamic> toMap() => {
    'plastic': plastic,
    'organic': organic,
    'glass': glass,
    'metal': metal,
    'hazardous': hazardous,
    'other': other,
  };
}

class ImageAnalysisResult {
  final String imageHash;
  final String analysisMode; // 'gemini' | 'mock'
  final double dirtyScore;   // 0.0 – 1.0
  final double cleanScore;   // 0.0 – 1.0
  final AnalysisVerdict verdict;
  final String verdictLabel;
  final String confidence;   // HIGH | MEDIUM | LOW
  final AnalysisFlags flags;
  final WasteCategories categories;
  final String description;  // AI'ın Türkçe açıklaması
  final bool isPhotoVerified;
  final int processingTimeMs;
  final DateTime timestamp;
  final String? error;

  const ImageAnalysisResult({
    required this.imageHash,
    required this.analysisMode,
    required this.dirtyScore,
    required this.cleanScore,
    required this.verdict,
    required this.verdictLabel,
    required this.confidence,
    required this.flags,
    required this.categories,
    required this.description,
    required this.isPhotoVerified,
    required this.processingTimeMs,
    required this.timestamp,
    this.error,
  });

  // ── Yardımcı getter'lar ──────────────────────────────────────────────────
  bool get isConfirmedDirty => verdict == AnalysisVerdict.verifiedDirty;
  bool get isLikelyDirty => verdict == AnalysisVerdict.likelyDirty;
  bool get shouldAddToMap => dirtyScore >= AnalysisConfig.cleanThreshold;
  bool get isRejected => verdict == AnalysisVerdict.rejectedClean;

  int get dirtyPercent => (dirtyScore * 100).round();
  int get cleanPercent => (cleanScore * 100).round();

  Color get verdictColor {
    switch (verdict) {
      case AnalysisVerdict.verifiedDirty: return const Color(0xFFE53E3E);
      case AnalysisVerdict.likelyDirty:   return const Color(0xFFED8936);
      case AnalysisVerdict.uncertain:      return const Color(0xFFECC94B);
      case AnalysisVerdict.rejectedClean: return const Color(0xFF38A169);
    }
  }

  String get verdictEmoji {
    switch (verdict) {
      case AnalysisVerdict.verifiedDirty: return '🚨';
      case AnalysisVerdict.likelyDirty:   return '⚠️';
      case AnalysisVerdict.uncertain:      return '🔍';
      case AnalysisVerdict.rejectedClean: return '✅';
    }
  }

  Map<String, dynamic> toFirestore() => {
    'imageHash': imageHash,
    'analysisMode': analysisMode,
    'dirtyScore': dirtyScore,
    'cleanScore': cleanScore,
    'verdict': verdictLabel,
    'confidence': confidence,
    'flags': flags.toMap(),
    'categories': categories.toMap(),
    'description': description,
    'isPhotoVerified': isPhotoVerified,
    'processingTimeMs': processingTimeMs,
    'analyzedAt': FieldValue.serverTimestamp(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ana Servis
// ─────────────────────────────────────────────────────────────────────────────
class ImageAnalysisService {
  static final ImageAnalysisService _instance = ImageAnalysisService._internal();
  factory ImageAnalysisService() => _instance;
  ImageAnalysisService._internal();

  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final _random = Random();

  // ── Public API ────────────────────────────────────────────────────────────

  /// Görüntüyü analiz et.
  /// [imageBytes] ham görüntü verisi
  /// [type] analiz türü (kirli bildirim mi, temizleme kanıtı mı)
  /// [reportId] ilişkili raporun Firestore ID'si (varsa)
  Future<ImageAnalysisResult> analyzeImage({
    required Uint8List imageBytes,
    required AnalysisType type,
    String? reportId,
    String? groupId,
  }) async {
    final stopwatch = Stopwatch()..start();

    try {
      // Boyut kontrolü
      if (imageBytes.length > AnalysisConfig.maxImageBytes) {
        imageBytes = await _compressImage(imageBytes);
      }

      final imageHash = _hashImage(imageBytes);
      final base64Image = base64Encode(imageBytes);

      // Analiz yap
      ImageAnalysisResult result;
      if (AnalysisConfig.useMock) {
        result = await _mockAnalysis(
          imageHash: imageHash,
          type: type,
          elapsedMs: stopwatch.elapsedMilliseconds,
        );
      } else {
        try {
          result = await _geminiAnalysis(
            imageHash: imageHash,
            base64Image: base64Image,
            type: type,
            elapsedMs: stopwatch.elapsedMilliseconds,
          );
        } catch (e) {
          debugPrint('Gemini API hatası (Kota dolmuş olabilir), mock moda geçiliyor: $e');
          result = await _mockAnalysis(
            imageHash: imageHash,
            type: type,
            elapsedMs: stopwatch.elapsedMilliseconds,
          );
        }
      }

      // Firestore'a kaydet
      await _saveToFirestore(result, type: type, reportId: reportId, groupId: groupId);

      stopwatch.stop();
      return result;
    } catch (e) {
      stopwatch.stop();
      debugPrint('ImageAnalysisService error: $e');
      return _errorResult(error: e.toString());
    }
  }

  // ── Gemini Vision API ─────────────────────────────────────────────────────
  Future<ImageAnalysisResult> _geminiAnalysis({
    required String imageHash,
    required String base64Image,
    required AnalysisType type,
    required int elapsedMs,
  }) async {
    final stopwatch = Stopwatch()..start();

    final prompt = type == AnalysisType.dirtyReport
        ? _dirtyReportPrompt
        : _cleanEvidencePrompt;

    final requestBody = {
      'contents': [
        {
          'parts': [
            {'text': prompt},
            {
              'inline_data': {
                'mime_type': 'image/jpeg',
                'data': base64Image,
              }
            }
          ]
        }
      ],
      'generationConfig': {
        'temperature': 0.1, // Düşük temperature = tutarlı sonuçlar
        'maxOutputTokens': 512,
      }
    };

    final response = await http.post(
      Uri.parse(
        'https://generativelanguage.googleapis.com/v1beta/models/'
        '${AnalysisConfig.model}:generateContent'
        '?key=${AnalysisConfig.geminiApiKey}',
      ),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(requestBody),
    ).timeout(const Duration(seconds: 30));

    stopwatch.stop();

    if (response.statusCode != 200) {
      throw Exception('Gemini API error ${response.statusCode}: ${response.body}');
    }

    final data = jsonDecode(response.body);
    final text = data['candidates']?[0]?['content']?['parts']?[0]?['text'] ?? '';

    return _parseGeminiResponse(
      text: text,
      imageHash: imageHash,
      processingTimeMs: stopwatch.elapsedMilliseconds + elapsedMs,
    );
  }

  // ── Gemini Prompt'ları ───────────────────────────────────────────────────
  static const String _dirtyReportPrompt = '''
Sen dünya çapında bir çevre mühendisi ve ekolojik denetim uzmanısın. Sana gönderilen fotoğrafı en ince ayrıntısına kadar analiz etmen gerekiyor. 

### ANALİZ KURALLARI:
1. **Yapay Nesneleri Belirle:** Fotoğraftaki insan kaynaklı atıkları (plastik şişeler, poşetler, metal kutular, inşaat molozları vb.) doğal nesnelerden (yaprak, dal, çamur, deniz yosunu) kesinlikle ayırt et. Doğal nesneler "kirlilik" sayılmaz.
2. **Kirlilik Puanı (dirtyScore):** 
   - 0.0-0.2: Tertemiz doğa veya iç mekan.
   - 0.3-0.5: Hafif/dağınık kirlilik (birkaç izmarit veya poşet).
   - 0.6-0.8: Belirgin kirlilik (çöp yığınları, çevreye yayılmış atıklar).
   - 0.9-1.0: Ekolojik felaket/Yoğun kirlilik (yasadışı döküm alanları, nehirde yüzen çöpler).
3. **Tehlikeli Atık Saptama:** Eğer pil, elektronik atık, tıbbi atık veya kimyasal/yağ sızıntısı görüyorsan "isHazardous" true olmalı.
4. **Çevresel Bağlam:** Görüntü dış mekan (park, sahil, orman) değilse "isOutdoor" false ver.

### YANIT FORMATI (SADECE JSON):
{
  "dirtyScore": 0.0-1.0,
  "cleanScore": 0.0-1.0,
  "isOutdoor": boolean,
  "hasHuman": boolean,
  "isWaterBody": boolean,
  "isHazardous": boolean,
  "plastic": 0.0-1.0,
  "organic": 0.0-1.0,
  "glass": 0.0-1.0,
  "metal": 0.0-1.0,
  "hazardous": 0.0-1.0,
  "description": "Profesyonel ve açıklayıcı Türkçe özet (Örn: 'Sahilde yoğun plastik ve cam şişe atıkları saptandı. Acil müdahale önerilir.')"
}
''';

  static const String _cleanEvidencePrompt = '''
Sen bir çevre temizliği doğrulama yapay zekasısın. Bu fotoğraf bir temizlik operasyonunun kanıtı. Analiz et:

{
  "dirtyScore": 0.0-1.0 arası sayı (hala kirlilik var mı),
  "cleanScore": 0.0-1.0 arası sayı (temizlik başarısı),
  "isOutdoor": true/false,
  "hasHuman": true/false,
  "isWaterBody": true/false,
  "isHazardous": false,
  "plastic": 0.0-1.0 (kalan plastik),
  "organic": 0.0-1.0 (kalan organik),
  "glass": 0.0-1.0,
  "metal": 0.0-1.0,
  "description": "Türkçe kısa açıklama (max 100 karakter)"
}

Not: Temizleme kanıtı fotoğrafında cleanScore yüksek olmalı.
''';

  // ── Gemini Yanıtını Parse Et ──────────────────────────────────────────────
  ImageAnalysisResult _parseGeminiResponse({
    required String text,
    required String imageHash,
    required int processingTimeMs,
  }) {
    try {
      // JSON'u metinden çıkar
      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(text);
      if (jsonMatch == null) throw Exception('No JSON in response');

      final json = jsonDecode(jsonMatch.group(0)!) as Map<String, dynamic>;

      final dirtyScore = (json['dirtyScore'] as num?)?.toDouble() ?? 0.5;
      final cleanScore = (json['cleanScore'] as num?)?.toDouble() ?? 0.5;

      return _buildResult(
        imageHash: imageHash,
        analysisMode: 'gemini',
        dirtyScore: dirtyScore.clamp(0.0, 1.0),
        cleanScore: cleanScore.clamp(0.0, 1.0),
        flags: AnalysisFlags(
          isOutdoor: json['isOutdoor'] as bool? ?? true,
          hasHuman: json['hasHuman'] as bool? ?? false,
          isWaterBody: json['isWaterBody'] as bool? ?? false,
          isHazardous: json['isHazardous'] as bool? ?? false,
        ),
        categories: WasteCategories(
          plastic: (json['plastic'] as num?)?.toDouble() ?? 0,
          organic: (json['organic'] as num?)?.toDouble() ?? 0,
          glass: (json['glass'] as num?)?.toDouble() ?? 0,
          metal: (json['metal'] as num?)?.toDouble() ?? 0,
          hazardous: (json['hazardous'] as num?)?.toDouble() ?? 0,
        ),
        description: json['description'] as String? ?? 'Analiz tamamlandı',
        processingTimeMs: processingTimeMs,
      );
    } catch (e) {
      debugPrint('Gemini parse error: $e\nResponse: $text');
      // Parse hatası → mock'a düş
      return _buildMockResult(imageHash: imageHash, type: AnalysisType.dirtyReport, elapsedMs: processingTimeMs);
    }
  }

  // ── Mock Analiz Motoru ────────────────────────────────────────────────────
  Future<ImageAnalysisResult> _mockAnalysis({
    required String imageHash,
    required AnalysisType type,
    required int elapsedMs,
  }) async {
    // Gerçekçi gecikme simülasyonu
    await Future.delayed(Duration(milliseconds: 400 + _random.nextInt(600)));
    return _buildMockResult(imageHash: imageHash, type: type, elapsedMs: elapsedMs);
  }

  ImageAnalysisResult _buildMockResult({
    required String imageHash,
    required AnalysisType type,
    required int elapsedMs,
  }) {
    // Mock: kirli bildirimler için yüksek dirty score,
    //        temizleme kanıtları için yüksek clean score
    double dirtyScore;
    String description;

    if (type == AnalysisType.dirtyReport) {
      // %70 ihtimalle gerçek kirlilik, %20 belirsiz, %10 sahte
      final roll = _random.nextDouble();
      if (roll < 0.70) {
        dirtyScore = 0.72 + _random.nextDouble() * 0.25; // 0.72–0.97
        description = 'Alanda plastik ve organik atık tespit edildi.';
      } else if (roll < 0.90) {
        dirtyScore = 0.35 + _random.nextDouble() * 0.30; // 0.35–0.65
        description = 'Görüntü analiz edildi, kısmi kirlilik mevcut.';
      } else {
        dirtyScore = 0.05 + _random.nextDouble() * 0.12; // 0.05–0.17
        description = 'Bu görüntü temiz bir alan gösteriyor.';
      }
    } else {
      // Temizleme kanıtı: genellikle temiz sonuç
      dirtyScore = 0.05 + _random.nextDouble() * 0.20; // 0.05–0.25
      description = 'Temizleme başarıyla tamamlanmış görünüyor.';
    }

    return _buildResult(
      imageHash: imageHash,
      analysisMode: 'mock',
      dirtyScore: dirtyScore.clamp(0.0, 1.0),
      cleanScore: (1.0 - dirtyScore).clamp(0.0, 1.0),
      flags: AnalysisFlags(
        isOutdoor: true,
        hasHuman: _random.nextDouble() < 0.05,
        isWaterBody: _random.nextDouble() < 0.25,
        isHazardous: _random.nextDouble() < 0.08,
      ),
      categories: WasteCategories(
        plastic: 0.3 + _random.nextDouble() * 0.4,
        organic: 0.1 + _random.nextDouble() * 0.3,
        glass: _random.nextDouble() * 0.15,
        metal: _random.nextDouble() * 0.10,
        hazardous: _random.nextDouble() < 0.1 ? 0.2 + _random.nextDouble() * 0.3 : 0.0,
      ),
      description: description,
      processingTimeMs: elapsedMs + 400 + _random.nextInt(600),
    );
  }

  // ── Result Builder ─────────────────────────────────────────────────────────
  ImageAnalysisResult _buildResult({
    required String imageHash,
    required String analysisMode,
    required double dirtyScore,
    required double cleanScore,
    required AnalysisFlags flags,
    required WasteCategories categories,
    required String description,
    required int processingTimeMs,
  }) {
    // Karar motoru
    final AnalysisVerdict verdict;
    final String verdictLabel;

    if (dirtyScore > AnalysisConfig.dirtyThreshold) {
      verdict = AnalysisVerdict.verifiedDirty;
      verdictLabel = 'VERIFIED_DIRTY';
    } else if (dirtyScore > 0.50) {
      verdict = AnalysisVerdict.likelyDirty;
      verdictLabel = 'LIKELY_DIRTY';
    } else if (dirtyScore > AnalysisConfig.cleanThreshold) {
      verdict = AnalysisVerdict.uncertain;
      verdictLabel = 'UNCERTAIN';
    } else {
      verdict = AnalysisVerdict.rejectedClean;
      verdictLabel = 'REJECTED_CLEAN';
    }

    // Güven düzeyi
    final spread = (dirtyScore - cleanScore).abs();
    final String confidence;
    if (spread > 0.5) {
      confidence = 'HIGH';
    } else if (spread > 0.25) {
      confidence = 'MEDIUM';
    } else {
      confidence = 'LOW';
    }

    return ImageAnalysisResult(
      imageHash: imageHash,
      analysisMode: analysisMode,
      dirtyScore: dirtyScore,
      cleanScore: cleanScore,
      verdict: verdict,
      verdictLabel: verdictLabel,
      confidence: confidence,
      flags: flags,
      categories: categories,
      description: description,
      isPhotoVerified: verdict == AnalysisVerdict.verifiedDirty ||
          verdict == AnalysisVerdict.likelyDirty,
      processingTimeMs: processingTimeMs,
      timestamp: DateTime.now(),
    );
  }

  // ── Firestore'a Kaydet ────────────────────────────────────────────────────
  Future<void> _saveToFirestore(
    ImageAnalysisResult result, {
    required AnalysisType type,
    String? reportId,
    String? groupId,
  }) async {
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid;
      final data = {
        ...result.toFirestore(),
        'userId': uid,
        'type': type == AnalysisType.dirtyReport ? 'dirty_report' : 'clean_evidence',
        if (reportId != null) 'reportId': reportId,
        if (groupId != null) 'groupId': groupId,
      };

      // Analiz loguna kaydet
      await _db.collection('image_analysis_logs').add(data);

      // Raporu güncelle (varsa)
      if (reportId != null) {
        await _db.collection('reports').doc(reportId).update({
          'aiAnalysis': data,
          'isVerified': result.isPhotoVerified,
          'status': result.shouldAddToMap ? 'verified' : 'rejected',
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }

      // Tehlikeli atık varsa acil bildirim oluştur
      if (result.flags.isHazardous && result.isConfirmedDirty) {
        await _db.collection('emergency_reports').add({
          ...data,
          'priority': 'HIGH',
          'alertedAt': FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      debugPrint('Firestore save error: $e');
    }
  }

  // ── Yardımcı Fonksiyonlar ─────────────────────────────────────────────────
  String _hashImage(Uint8List bytes) {
    int hash = 0;
    for (final byte in bytes.take(1024)) {
      hash = (hash * 31 + byte) & 0xFFFFFFFF;
    }
    return hash.toRadixString(16).padLeft(8, '0');
  }

  Future<Uint8List> _compressImage(Uint8List bytes) async {
    // Web ve mobilde farklı sıkıştırma stratejileri
    // Bu basitleştirilmiş versiyon: şimdilik ham bytes dönüyor
    // Not: sublist() ile byte kesmek resmi bozar, bu yüzden tamamını döndürüyoruz.
    if (bytes.length > AnalysisConfig.maxImageBytes) {
      debugPrint('Uyarı: Görüntü boyutu ${AnalysisConfig.maxImageBytes} baytı aşıyor!');
    }
    return bytes;
  }

  ImageAnalysisResult _errorResult({required String error}) {
    return ImageAnalysisResult(
      imageHash: 'error',
      analysisMode: 'error',
      dirtyScore: 0.0,
      cleanScore: 0.0,
      verdict: AnalysisVerdict.uncertain,
      verdictLabel: 'ERROR',
      confidence: 'LOW',
      flags: const AnalysisFlags(),
      categories: const WasteCategories(),
      description: 'Analiz sırasında hata oluştu.',
      isPhotoVerified: false,
      processingTimeMs: 0,
      timestamp: DateTime.now(),
      error: error,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Flutter renk import
// ─────────────────────────────────────────────────────────────────────────────
// ignore: implementation_imports
