import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'theme.dart';

/// Splash ekranı – Firebase onAuthStateChanged'e göre yönlendirme:
/// • Aktif kullanıcı varsa → doğrudan /auth (AuthWrapper → Dashboard)
/// • Kullanıcı yoksa → /auth (AuthWrapper → AuthScreen)
class SplashScreen extends StatefulWidget {
  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _progressController;
  String _statusText = 'Başlatılıyor...';

  @override
  void initState() {
    super.initState();

    _logoController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    )..forward();

    _progressController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    )..forward();

    _initializeAndNavigate();
  }

  Future<void> _initializeAndNavigate() async {
    // Minimum splash süresi (animasyon için)
    await Future.delayed(const Duration(milliseconds: 400));

    if (!mounted) return;
    setState(() => _statusText = 'Firebase bağlantısı kontrol ediliyor...');

    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;

    // ─ Persistent Login: currentUser kontrolü ─────────────────────────────
    final User? currentUser = FirebaseAuth.instance.currentUser;

    if (currentUser != null) {
      // Aktif oturum var → refresh et ve devam et
      try {
        await currentUser.reload();
        setState(() => _statusText = 'Hoşgeldiniz, ${currentUser.displayName ?? "Gönüllü"}!');
      } catch (_) {
        // Ağ hatası olsa bile devam et
        setState(() => _statusText = 'Oturum yükleniyor...');
      }
    } else {
      setState(() => _statusText = 'Giriş sayfasına yönlendiriliyor...');
    }

    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;

    // AuthWrapper stream'i zaten User'ı dinliyor; /auth rotasına git
    Navigator.of(context).pushReplacementNamed('/auth');
  }

  @override
  void dispose() {
    _logoController.dispose();
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppTheme.primaryColor,
              AppTheme.primaryLight,
              AppTheme.secondaryColor,
            ],
            stops: [0.0, 0.6, 1.0],
          ),
        ),
        child: Stack(
          children: [
            // ── Dekoratif Arka Plan ──────────────────────────────────────────
            Positioned(
              right: -80, top: -80,
              child: _decorCircle(250, 0.05),
            ),
            Positioned(
              left: -50, bottom: -50,
              child: _decorCircle(200, 0.07),
            ),
            Positioned(
              left: 60, top: 140,
              child: _decorCircle(80, 0.04),
            ),

            // ── Ana İçerik ───────────────────────────────────────────────────
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  ScaleTransition(
                    scale: CurvedAnimation(
                      parent: _logoController,
                      curve: Curves.elasticOut,
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(15),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.white.withOpacity(0.4),
                            blurRadius: 30,
                            spreadRadius: 5,
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/images/logo.png',
                          width: 100,
                          height: 100,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Uygulama Adı
                  const Text(
                    'Temiz Dünya',
                    style: TextStyle(
                      fontSize: 50,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 2,
                      shadows: [
                        Shadow(color: Colors.black26, offset: Offset(0, 4), blurRadius: 8),
                      ],
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 300.ms)
                      .slideY(begin: 0.3, end: 0, duration: 600.ms),

                  const SizedBox(height: 8),

                  const Text(
                    '🌱 Çevre Temizliği Platformu',
                    style: TextStyle(
                      fontSize: 15,
                      color: Colors.white70,
                      letterSpacing: 1.2,
                      fontWeight: FontWeight.w500,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 500.ms)
                      .slideY(begin: 0.2, end: 0, duration: 600.ms),

                  const SizedBox(height: 64),

                  // Progress Bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 48),
                    child: AnimatedBuilder(
                      animation: _progressController,
                      builder: (_, __) => Column(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: LinearProgressIndicator(
                              value: _progressController.value,
                              minHeight: 5,
                              backgroundColor: Colors.white24,
                              valueColor: const AlwaysStoppedAnimation(Colors.white),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            '${(_progressController.value * 100).toInt()}%',
                            style: const TextStyle(
                              fontSize: 13,
                              color: Colors.white60,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Durum Metni
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    child: Text(
                      _statusText,
                      key: ValueKey(_statusText),
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.white54,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _decorCircle(double size, double opacity) {
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withOpacity(opacity),
      ),
    );
  }
}
