import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'image_analysis_service.dart';
import 'theme.dart';

/// Analiz sonucunu gösteren tam ekran dialog / bottom sheet.
class AnalysisResultSheet extends StatelessWidget {
  final ImageAnalysisResult result;
  final VoidCallback? onConfirm;  // "Haritaya Ekle" veya "Tamam"
  final VoidCallback? onRetry;    // "Tekrar Çek"

  const AnalysisResultSheet({
    Key? key,
    required this.result,
    this.onConfirm,
    this.onRetry,
  }) : super(key: key);

  /// Bottom sheet olarak göster
  static Future<bool?> show(
    BuildContext context, {
    required ImageAnalysisResult result,
    VoidCallback? onRetry,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AnalysisResultSheet(
        result: result,
        onRetry: onRetry,
        onConfirm: () => Navigator.pop(context, true),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            width: 40, height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),

          // Başlık
          _buildHeader(),
          const SizedBox(height: 20),

          // Score Göstergesi
          _buildScoreBar(),
          const SizedBox(height: 20),

          // AI Açıklaması
          _buildDescription(),
          const SizedBox(height: 16),

          // Bayraklar
          if (_hasFlags()) ...[
            _buildFlags(),
            const SizedBox(height: 16),
          ],

          // Atık Kategorileri (sadece kirli sonuçlarda)
          if (result.isConfirmedDirty || result.isLikelyDirty) ...[
            _buildWasteCategories(),
            const SizedBox(height: 16),
          ],

          // Analiz modu badge
          _buildModeBadge(),
          const SizedBox(height: 24),

          // Aksiyon Butonları
          _buildActions(context),
        ],
      ),
    ).animate().slideY(begin: 1, end: 0, duration: 400.ms, curve: Curves.easeOut);
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          width: 72, height: 72,
          decoration: BoxDecoration(
            color: result.verdictColor.withOpacity(0.12),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              result.verdictEmoji,
              style: const TextStyle(fontSize: 36),
            ),
          ),
        ).animate().scaleXY(begin: 0.5, duration: 600.ms, curve: Curves.elasticOut),
        const SizedBox(height: 12),
        Text(
          _verdictTitle,
          style: TextStyle(
            fontSize: 20, fontWeight: FontWeight.bold,
            color: result.verdictColor,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: _confidenceColor.withOpacity(0.12),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            'Güven: ${result.confidence} · ${result.processingTimeMs}ms',
            style: TextStyle(fontSize: 11, color: _confidenceColor, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }

  Widget _buildScoreBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _scoreLabel('🔴 Kirlilik', result.dirtyScore, const Color(0xFFE53E3E)),
              _scoreLabel('🟢 Temizlik', result.cleanScore, const Color(0xFF38A169)),
            ],
          ),
          const SizedBox(height: 12),
          // İkili progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Stack(
              children: [
                Container(height: 14, color: const Color(0xFF38A169).withOpacity(0.2)),
                FractionallySizedBox(
                  widthFactor: result.dirtyScore,
                  child: Container(
                    height: 14,
                    decoration: BoxDecoration(
                      color: result.verdictColor,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
          ).animate().slideX(begin: -1, duration: 800.ms, curve: Curves.easeOut),
          const SizedBox(height: 8),
          Text(
            'Eşik: Kirli > 70% | Temiz < 20%',
            style: TextStyle(fontSize: 10, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _scoreLabel(String label, double score, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF64748B))),
        Text(
          '%${(score * 100).round()}',
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: color),
        ),
      ],
    );
  }

  Widget _buildDescription() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.primaryColor.withOpacity(0.15)),
      ),
      child: Row(
        children: [
          Icon(Icons.auto_awesome, color: AppTheme.primaryColor, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              result.description,
              style: TextStyle(fontSize: 13, color: Colors.grey[700], height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  bool _hasFlags() =>
      result.flags.hasHuman ||
      result.flags.isWaterBody ||
      result.flags.isHazardous;

  Widget _buildFlags() {
    return Wrap(
      spacing: 8, runSpacing: 8,
      children: [
        if (result.flags.hasHuman)
          _flagChip('👤 İnsan Yüzü', Colors.blue),
        if (result.flags.isWaterBody)
          _flagChip('🌊 Su Kıyısı', Colors.cyan),
        if (result.flags.isHazardous)
          _flagChip('☢️ Tehlikeli Atık', Colors.red),
      ],
    );
  }

  Widget _flagChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
    );
  }

  Widget _buildWasteCategories() {
    final cats = result.categories;
    final entries = [
      ('♻️ Plastik', cats.plastic),
      ('🌿 Organik', cats.organic),
      ('🫙 Cam', cats.glass),
      ('🔩 Metal', cats.metal),
      ('☢️ Tehlikeli', cats.hazardous),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Atık Türleri', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
        const SizedBox(height: 8),
        ...entries.where((e) => e.$2 > 0.05).map((e) => Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Row(
            children: [
              SizedBox(width: 80, child: Text(e.$1, style: const TextStyle(fontSize: 12))),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: e.$2,
                    minHeight: 8,
                    backgroundColor: Colors.grey[100],
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
              SizedBox(
                width: 36,
                child: Text(
                  '%${(e.$2 * 100).round()}',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                  textAlign: TextAlign.right,
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }

  Widget _buildModeBadge() {
    final isMock = result.analysisMode == 'mock';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isMock ? Colors.orange.withOpacity(0.1) : Colors.green.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isMock ? Colors.orange.withOpacity(0.3) : Colors.green.withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isMock ? Icons.science_outlined : Icons.verified_outlined,
            size: 14,
            color: isMock ? Colors.orange : Colors.green,
          ),
          const SizedBox(width: 6),
          Text(
            isMock ? 'Simülasyon Modu (Geliştirme)' : 'Gemini AI ile Analiz Edildi',
            style: TextStyle(
              fontSize: 11,
              color: isMock ? Colors.orange[800] : Colors.green[800],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActions(BuildContext context) {
    if (result.isRejected) {
      return Column(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.orange.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: Colors.orange, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Bu görüntü kirlilik içermiyor veya dış mekanda değil.',
                    style: TextStyle(fontSize: 12, color: Colors.orange[800]),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (onRetry != null)
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () { Navigator.pop(context); onRetry!(); },
                    icon: const Icon(Icons.refresh),
                    label: const Text('Tekrar Çek'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              if (onRetry != null) const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, false),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey[200],
                    foregroundColor: Colors.grey[700],
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: const Text('Kapat'),
                ),
              ),
            ],
          ),
        ],
      );
    }

    return Row(
      children: [
        if (onRetry != null)
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () { Navigator.pop(context); onRetry!(); },
              icon: const Icon(Icons.refresh),
              label: const Text('Tekrar Çek'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        if (onRetry != null) const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: onConfirm,
            icon: const Icon(Icons.check_circle_outline),
            label: Text(
              result.isConfirmedDirty ? 'Haritaya Ekle ✅' : 'Onayla',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: result.verdictColor,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
      ],
    );
  }

  // ── Yardımcı getter'lar ──────────────────────────────────────────────────
  String get _verdictTitle {
    switch (result.verdict) {
      case AnalysisVerdict.verifiedDirty:
        return '🚨 Kirlilik Doğrulandı';
      case AnalysisVerdict.likelyDirty:
        return '⚠️ Muhtemelen Kirli';
      case AnalysisVerdict.uncertain:
        return '🔍 Belirsiz — İnceleme Gerekli';
      case AnalysisVerdict.rejectedClean:
        return '✅ Kirlilik Tespit Edilmedi';
    }
  }

  Color get _confidenceColor {
    switch (result.confidence) {
      case 'HIGH': return Colors.green[700]!;
      case 'MEDIUM': return Colors.orange[700]!;
      default: return Colors.grey[600]!;
    }
  }
}
