import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'camera_service.dart';
import 'firestore_service.dart';
import 'scoring_algorithm.dart';
import 'image_analysis_service.dart';
import 'analysis_result_sheet.dart';
import 'theme.dart';
import 'package:provider/provider.dart';

/// Temizlik oturumu fotoğraf çekme + AI analiz ekranı.
///
/// Akış:
/// 1. Kullanıcı fotoğraf çeker
/// 2. AI analiz başlar (loading overlay)
/// 3. Analiz sonucu bottom sheet'te gösterilir
/// 4. Kullanıcı onaylarsa puan hesaplanır + Firestore'a kaydedilir
class CameraScreen extends StatefulWidget {
  final String operationId;
  final String userId;
  final String groupId;

  const CameraScreen({
    Key? key,
    required this.operationId,
    required this.userId,
    required this.groupId,
  }) : super(key: key);

  @override
  _CameraScreenState createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  late CameraService cameraService;
  CameraController? _cameraController;
  bool _isInitialized = false;
  bool _isAnalyzing = false;
  String _analysisStatus = '';
  ImageAnalysisResult? _lastResult;

  // Temizlik form değerleri
  double _weight = 5;
  int _difficulty = 2;
  int _urgency = 2;
  int _teamMembers = 1;
  double _completionPercentage = 75;
  double _hoursSpent = 1.0;

  final _analysisService = ImageAnalysisService();

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    if (kIsWeb) {
      // Web'de kamera preview mevcut değil → galeri modunu kullan
      setState(() => _isInitialized = true);
      return;
    }

    cameraService = CameraService();
    final hasPermission = await cameraService.requestCameraPermission();

    if (hasPermission) {
      await cameraService.initializeCamera();
      _cameraController = cameraService.cameraController;
      if (mounted) setState(() => _isInitialized = true);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Kamera izni verilmedi')),
        );
        Navigator.pop(context);
      }
    }
  }

  // ── Fotoğraf Çek + Analiz ─────────────────────────────────────────────────
  Future<void> _captureAndAnalyze() async {
    setState(() {
      _isAnalyzing = true;
      _analysisStatus = 'Fotoğraf çekiliyor...';
    });

    try {
      Uint8List? imageBytes;

      if (kIsWeb) {
        // Web: galeri seç
        final picker = ImagePicker();
        final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
        if (picked == null) {
          setState(() => _isAnalyzing = false);
          return;
        }
        imageBytes = await picked.readAsBytes();
      } else {
        final image = await cameraService.takePicture();
        if (image == null) {
          setState(() => _isAnalyzing = false);
          return;
        }
        imageBytes = await image.readAsBytes();
      }

      setState(() => _analysisStatus = '🤖 AI görüntüyü analiz ediyor...');

      // ── AI Analiz ────────────────────────────────────────────────────────
      final result = await _analysisService.analyzeImage(
        imageBytes: imageBytes,
        type: AnalysisType.cleanEvidence, // Temizleme kanıtı
        groupId: widget.groupId,
      );

      setState(() {
        _lastResult = result;
        _isAnalyzing = false;
        _analysisStatus = '';
      });

      if (!mounted) return;

      // ── Sonucu göster ────────────────────────────────────────────────────
      final confirmed = await AnalysisResultSheet.show(
        context,
        result: result,
        onRetry: _captureAndAnalyze,
      );

      if (confirmed == true && mounted) {
        await _saveCleanupSession(isVerified: result.isPhotoVerified);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isAnalyzing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Hata: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  Future<void> _saveCleanupSession({required bool isVerified}) async {
    try {
      final firestore = Provider.of<FirestoreService>(context, listen: false);
      final result = await firestore.calculateAndUpdateCleanupScore(
        userId: widget.userId,
        groupId: widget.groupId,
        weight: _weight,
        difficulty: _difficulty,
        urgency: _urgency,
        membersCount: _teamMembers,
        completionPercentage: _completionPercentage,
        isPhotoVerified: isVerified,
        hoursSpent: _hoursSpent,
      );

      if (mounted) {
        final score = result['score']?.toInt() ?? 0;
        final bonus = isVerified ? ' (+AI Bonus!)' : '';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('🎉 $score puan kazandınız$bonus'),
            backgroundColor: AppTheme.primaryColor,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        Navigator.pop(context, result);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Kayıt hatası: $e'), backgroundColor: AppTheme.errorColor),
        );
      }
    }
  }

  @override
  void dispose() {
    if (!kIsWeb) cameraService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Temizlik Oturumu Kayıt'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Stack(
        children: [
          // ── Kamera veya Web Placeholder ──────────────────────────────────
          if (!kIsWeb && _isInitialized && _cameraController != null)
            Positioned.fill(child: CameraPreview(_cameraController!))
          else if (kIsWeb)
            Positioned.fill(child: _buildWebPlaceholder())
          else
            const Center(child: CircularProgressIndicator()),

          // ── Form Overlay (alt) ───────────────────────────────────────────
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: _buildFormOverlay(),
          ),

          // ── Analiz Loading Overlay ────────────────────────────────────────
          if (_isAnalyzing) _buildAnalyzingOverlay(),
        ],
      ),
    );
  }

  Widget _buildWebPlaceholder() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter, end: Alignment.bottomCenter,
          colors: [Colors.grey[900]!, Colors.grey[800]!],
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.camera_alt, size: 80, color: Colors.white.withOpacity(0.3)),
          const SizedBox(height: 16),
          Text(
            'Web modunda kamera önizlemesi\ndesteklenmiyor.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 14),
          ),
          const SizedBox(height: 8),
          Text(
            'Galeriden fotoğraf seçebilirsiniz.',
            style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildFormOverlay() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter, end: Alignment.bottomCenter,
          colors: [Colors.transparent, Colors.black.withOpacity(0.95)],
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 40, 20, 24),
      child: Column(
        children: [
          // Sliderlar
          _buildSlider('⚖️ Ağırlık', '${_weight.toStringAsFixed(1)} kg', _weight, 0.5, 50, (v) => _weight = v),
          _buildSlider(
            '💪 Zorluk',
            CleanupDifficulty.values.firstWhere((e) => e.value == _difficulty).label,
            _difficulty.toDouble(), 1, 5,
            (v) => _difficulty = v.toInt(), divisions: 4,
          ),
          _buildSlider('👥 Ekip', '$_teamMembers kişi', _teamMembers.toDouble(), 1, 20, (v) => _teamMembers = v.toInt(), divisions: 19),
          _buildSlider('✅ Tamamlanma', '%${_completionPercentage.toInt()}', _completionPercentage, 0, 100, (v) => _completionPercentage = v, divisions: 10),
          const SizedBox(height: 16),

          // Fotoğraf Çek Butonu
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton.icon(
              onPressed: _isAnalyzing ? null : _captureAndAnalyze,
              icon: const Icon(Icons.camera_alt, size: 22),
              label: Text(
                kIsWeb ? 'Galeriden Seç & Analiz Et' : 'Fotoğraf Çek & Analiz Et',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 8,
                shadowColor: AppTheme.primaryColor.withOpacity(0.4),
              ),
            ),
          ).animate().fadeIn(delay: 200.ms),
        ],
      ),
    );
  }

  Widget _buildSlider(
    String label, String value, double current, double min, double max,
    void Function(double) onChanged, {int? divisions}
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
          ),
          Expanded(
            child: SliderTheme(
              data: SliderThemeData(
                trackHeight: 3,
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
                overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
                activeTrackColor: AppTheme.primaryLight,
                inactiveTrackColor: Colors.white12,
                thumbColor: Colors.white,
                overlayColor: AppTheme.primaryColor.withOpacity(0.2),
              ),
              child: Slider(
                value: current, min: min, max: max, divisions: divisions,
                onChanged: (v) => setState(() => onChanged(v)),
              ),
            ),
          ),
          SizedBox(
            width: 70,
            child: Text(value, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600), textAlign: TextAlign.right),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyzingOverlay() {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.75),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Animasyonlu AI ikonu
            Container(
              width: 100, height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primaryColor.withOpacity(0.2),
                border: Border.all(color: AppTheme.primaryColor, width: 2),
              ),
              child: const Center(
                child: Text('🤖', style: TextStyle(fontSize: 44)),
              ),
            ).animate(onPlay: (c) => c.repeat(reverse: true))
              .scaleXY(begin: 0.9, end: 1.05, duration: 800.ms),

            const SizedBox(height: 24),

            Text(
              _analysisStatus,
              style: const TextStyle(
                color: Colors.white, fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 1.5.seconds, color: AppTheme.primaryLight),

            const SizedBox(height: 12),

            Text(
              'Bu işlem birkaç saniye sürebilir...',
              style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12),
            ),
          ],
        ),
      ).animate().fadeIn(duration: 300.ms),
    );
  }
}