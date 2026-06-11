import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'auth_service.dart';
import 'theme.dart';

/// Onboarding + Akıllı Anket Sistemi
///
/// Akış:
/// 1. 3 tanıtım sayfası (animasyonlu)
/// 2. "Dünyayı beraber temizlemeye hoş geldin!" karşılama ekranı
/// 3. 3 soruluk anket (Firebase'e kaydedilir)
/// 4. Dashboard'a yönlendirme
class OnboardingScreen extends StatefulWidget {
  @override
  _OnboardingScreenState createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  late PageController _pageController;
  late AnimationController _welcomeController;
  int _currentPage = 0;
  bool _showWelcome = false;
  bool _showSurvey = false;

  // ── Anket Cevapları ────────────────────────────────────────────────────────
  int? _q1Answer; // Kaç kez temizlik yaptın?
  int? _q2Answer; // Hangi bölge türünde yardım etmek istersin?
  int? _q3Answer; // Haftada ne kadar zaman ayırabilirsin?
  bool _savingSurvey = false;

  final AuthService _authService = AuthService();

  static const _slides = [
    _SlideData(
      emoji: '🌍',
      title: 'Çevre Temizliği',
      desc: 'Yakınında temizlenecek bölgeleri keşfet ve gönüllü ol.\nSağlıklı bir dünya için katkıda bulun.',
      color: AppTheme.primaryColor,
      bgColor: AppTheme.primaryLight,
    ),
    _SlideData(
      emoji: '👥',
      title: 'Grup Oluştur',
      desc: 'Arkadaşlarınla grup oluştur ve birlikte hedeflere ulaş.\nBeraber daha güçlü, beraber daha etkili!',
      color: AppTheme.secondaryColor,
      bgColor: Color(0xFF26D0CE),
    ),
    _SlideData(
      emoji: '🏆',
      title: 'Puan Kazan',
      desc: 'Her temizlik görevini tamamladığında puan kazanmaya başla.\nBadge\'ler, başarılar ve lider tablosu!',
      color: AppTheme.successColor,
      bgColor: Color(0xFF66BB6A),
    ),
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _welcomeController = AnimationController(
      duration: const Duration(milliseconds: 900),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    _welcomeController.dispose();
    super.dispose();
  }

  // ── İleri ─────────────────────────────────────────────────────────────────
  void _nextPage() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    } else {
      // Tanıtım bitti → Hoş geldin ekranı
      setState(() => _showWelcome = true);
      _welcomeController.forward();
    }
  }

  void _proceedToSurvey() {
    setState(() {
      _showWelcome = false;
      _showSurvey = true;
    });
  }

  // ── Anket Kaydet + Dashboard'a Git ────────────────────────────────────────
  Future<void> _submitSurvey() async {
    if (_q1Answer == null || _q2Answer == null || _q3Answer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Lütfen tüm soruları yanıtlayın.'),
          backgroundColor: AppTheme.errorColor,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    setState(() => _savingSurvey = true);

    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid != null) {
      await _authService.saveSurveyResults(
        uid: uid,
        surveyData: {
          'cleanupExperience': _q1Options[_q1Answer!],
          'preferredArea': _q2Options[_q2Answer!],
          'weeklyAvailability': _q3Options[_q3Answer!],
          'q1Index': _q1Answer,
          'q2Index': _q2Answer,
          'q3Index': _q3Answer,
          'completedAt': DateTime.now().toIso8601String(),
        },
      );
    }

    if (!mounted) return;
    // AuthWrapper, oturumu stream'den alarak MainHomeScreen'e geçer.
    // Onboarding'den çıkmak için pop() veya pushReplacement kullanılabilir.
    Navigator.of(context).pop();
  }

  // ── Anket Seçenekleri ─────────────────────────────────────────────────────
  final _q1Options = [
    'Hiç yapmadım – İlk defa deniyorum',
    '1-3 kez yaptım',
    '4-10 kez yaptım',
    '10+ kez yaptım – Deneyimliyim',
  ];

  final _q2Options = [
    '🏖️ Kıyı ve plajlar',
    '🌲 Orman ve parklar',
    '🏙️ Şehir içi sokaklar',
    '🏔️ Dağ ve doğa yolları',
  ];

  final _q3Options = [
    'Ayda 1-2 kez',
    'Haftada 1 kez',
    'Haftada 2-3 kez',
    'Her gün – Tam zamanlı gönüllü',
  ];

  // ─────────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    if (_showSurvey) return _buildSurveyScreen();
    if (_showWelcome) return _buildWelcomeScreen();
    return _buildSlidesScreen();
  }

  // ── 1. Slayt Ekranı ───────────────────────────────────────────────────────
  Widget _buildSlidesScreen() {
    return Scaffold(
      body: Column(
        children: [
          // Atla
          SafeArea(
            child: Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: TextButton(
                  onPressed: () {
                    setState(() => _showWelcome = true);
                    _welcomeController.forward();
                  },
                  child: Text(
                    'Atla',
                    style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ),
          ),

          Expanded(
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: (i) => setState(() => _currentPage = i),
              itemCount: _slides.length,
              itemBuilder: (_, i) => _buildSlide(_slides[i]),
            ),
          ),

          // Indicator
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: SmoothPageIndicator(
              controller: _pageController,
              count: _slides.length,
              effect: ExpandingDotsEffect(
                dotColor: Colors.grey[300]!,
                activeDotColor: _slides[_currentPage].color,
                dotHeight: 10, dotWidth: 10, spacing: 8,
              ),
            ),
          ),

          // Butonlar
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
            child: Row(
              children: [
                if (_currentPage > 0)
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: () => _pageController.previousPage(
                        duration: const Duration(milliseconds: 400),
                        curve: Curves.easeInOut,
                      ),
                      label: const Text('Geri'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: BorderSide(color: AppTheme.primaryColor, width: 1.5),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                if (_currentPage > 0) const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    icon: Icon(_currentPage == _slides.length - 1
                        ? Icons.check
                        : Icons.arrow_forward),
                    onPressed: _nextPage,
                    label: Text(_currentPage == _slides.length - 1 ? 'Devam' : 'İleri',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSlide(_SlideData data) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            data.bgColor.withOpacity(0.15),
            data.color.withOpacity(0.08),
          ],
        ),
      ),
      child: Stack(
        children: [
          Positioned(right: -60, top: -60, child: _circle(200, data.color.withOpacity(0.08))),
          Positioned(left: -40, bottom: -40, child: _circle(150, data.bgColor.withOpacity(0.1))),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(data.emoji, style: const TextStyle(fontSize: 80))
                  .animate()
                  .scaleXY(begin: 0.7, duration: 600.ms)
                  .fadeIn()
                  .rotate(begin: -0.1, end: 0, duration: 600.ms),
              const SizedBox(height: 28),
              Text(
                data.title,
                style: TextStyle(
                  fontSize: 30, fontWeight: FontWeight.bold,
                  color: data.color, letterSpacing: 0.5,
                ),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 150.ms).slideY(begin: 0.3, end: 0, duration: 600.ms),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  data.desc,
                  style: TextStyle(fontSize: 15, color: Colors.grey[700], height: 1.6, fontWeight: FontWeight.w500),
                  textAlign: TextAlign.center,
                ),
              ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.3, end: 0, duration: 600.ms),
            ],
          ),
        ],
      ),
    );
  }

  // ── 2. Hoş Geldin Ekranı ──────────────────────────────────────────────────
  Widget _buildWelcomeScreen() {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppTheme.primaryColor, AppTheme.primaryLight, Color(0xFF4ECDC4)],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Animasyonlu hoş geldin ikonu
              ScaleTransition(
                scale: CurvedAnimation(parent: _welcomeController, curve: Curves.elasticOut),
                child: Container(
                  width: 120, height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.2),
                    border: Border.all(color: Colors.white.withOpacity(0.4), width: 3),
                  ),
                  child: const Center(
                    child: Text('🌍', style: TextStyle(fontSize: 64)),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'Dünyayı Beraber',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white, height: 1.2),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.3, end: 0, duration: 600.ms),
              const Text(
                'Temizlemeye',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white70, height: 1.2),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.3, end: 0, duration: 600.ms),
              const Text(
                'Hoş Geldin! 🎉',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white, height: 1.6),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.3, end: 0, duration: 600.ms),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  'Seni daha iyi tanımak için birkaç hızlı soru sormak istiyoruz. Bu sayede deneyimini kişiselleştirebiliriz.',
                  style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.8), height: 1.6),
                  textAlign: TextAlign.center,
                ),
              ).animate().fadeIn(delay: 700.ms),
              const SizedBox(height: 48),
              // Devam butonu
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: ElevatedButton.icon(
                  onPressed: _proceedToSurvey,
                  icon: const Icon(Icons.arrow_forward_rounded, size: 22),
                  label: const Text('Hızlı Anketi Başlat',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppTheme.primaryColor,
                    minimumSize: const Size(double.infinity, 56),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 8,
                    shadowColor: Colors.black26,
                  ),
                ),
              ).animate().fadeIn(delay: 800.ms).slideY(begin: 0.4, end: 0, duration: 500.ms),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Şimdi değil, geç',
                    style: TextStyle(color: Colors.white60, fontSize: 13)),
              ).animate().fadeIn(delay: 900.ms),
            ],
          ),
        ),
      ),
    );
  }

  // ── 3. Anket Ekranı ───────────────────────────────────────────────────────
  Widget _buildSurveyScreen() {
    final allAnswered = _q1Answer != null && _q2Answer != null && _q3Answer != null;

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: const Text('Hızlı Anket'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() {
            _showSurvey = false;
            _showWelcome = true;
          }),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Başlık
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.primaryColor.withOpacity(0.1), AppTheme.primaryLight.withOpacity(0.05)],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.primaryColor.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  const Text('📋', style: TextStyle(fontSize: 28)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('3 Kısa Soru',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
                        Text('Yanıtların deneyimini kişiselleştirecek',
                            style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                      ],
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn().slideY(begin: -0.2, end: 0),

            const SizedBox(height: 24),

            // Soru 1
            _buildQuestion(
              number: 1,
              question: 'Daha önce çevre temizlik aktivitelerine katıldın mı?',
              emoji: '🧹',
              options: _q1Options,
              selected: _q1Answer,
              onSelect: (i) => setState(() => _q1Answer = i),
            ),

            const SizedBox(height: 20),

            // Soru 2
            _buildQuestion(
              number: 2,
              question: 'Hangi bölge türünde temizlik yapmayı tercih edersin?',
              emoji: '🗺️',
              options: _q2Options,
              selected: _q2Answer,
              onSelect: (i) => setState(() => _q2Answer = i),
            ),

            const SizedBox(height: 20),

            // Soru 3
            _buildQuestion(
              number: 3,
              question: 'Haftada ne kadar zaman ayırabilirsin?',
              emoji: '⏰',
              options: _q3Options,
              selected: _q3Answer,
              onSelect: (i) => setState(() => _q3Answer = i),
            ),

            const SizedBox(height: 32),

            // Tamamla butonu
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                onPressed: (allAnswered && !_savingSurvey) ? _submitSurvey : null,
                icon: _savingSurvey
                    ? const SizedBox(
                        height: 20, width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                      )
                    : const Icon(Icons.check_circle_outline),
                label: Text(
                  _savingSurvey ? 'Kaydediliyor...' : 'Tamamla ve Başla 🚀',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  disabledBackgroundColor: Colors.grey[200],
                  disabledForegroundColor: Colors.grey[400],
                ),
              ),
            ).animate().fadeIn(delay: 400.ms),

            if (!allAnswered) ...[
              const SizedBox(height: 10),
              Center(
                child: Text(
                  '${[_q1Answer, _q2Answer, _q3Answer].where((x) => x != null).length}/3 soru yanıtlandı',
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
              ),
            ],

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestion({
    required int number,
    required String question,
    required String emoji,
    required List<String> options,
    required int? selected,
    required void Function(int) onSelect,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28, height: 28,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text('$number',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                ),
              ),
              const SizedBox(width: 10),
              Text(emoji, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  question,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF2D3E50), height: 1.3),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...options.asMap().entries.map((entry) {
            final i = entry.key;
            final opt = entry.value;
            final isSelected = selected == i;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: InkWell(
                onTap: () => onSelect(i),
                borderRadius: BorderRadius.circular(12),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.primaryColor.withOpacity(0.1) : Colors.grey[50],
                    border: Border.all(
                      color: isSelected ? AppTheme.primaryColor : Colors.grey[200]!,
                      width: isSelected ? 2 : 1,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 20, height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isSelected ? AppTheme.primaryColor : Colors.transparent,
                          border: Border.all(
                            color: isSelected ? AppTheme.primaryColor : Colors.grey[400]!,
                            width: 2,
                          ),
                        ),
                        child: isSelected
                            ? const Icon(Icons.check, color: Colors.white, size: 13)
                            : null,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          opt,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                            color: isSelected ? AppTheme.primaryColor : Colors.grey[700],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    ).animate().fadeIn(delay: (number * 100).ms).slideY(begin: 0.1, end: 0);
  }

  Widget _circle(double size, Color color) {
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}

class _SlideData {
  final String emoji;
  final String title;
  final String desc;
  final Color color;
  final Color bgColor;

  const _SlideData({
    required this.emoji,
    required this.title,
    required this.desc,
    required this.color,
    required this.bgColor,
  });
}
