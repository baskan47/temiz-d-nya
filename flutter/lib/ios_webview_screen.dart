import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// iOS'a özel tam ekran WebView ekranı.
/// Android sürümü bu ekranı hiç görmez; [main.dart]'taki
/// platform koşulu sayesinde yalnızca iOS build'inde aktiftir.
class IosWebViewScreen extends StatefulWidget {
  /// Açılacak web URL'si – main.dart'tan geçirilir.
  final String url;

  const IosWebViewScreen({Key? key, required this.url}) : super(key: key);

  @override
  State<IosWebViewScreen> createState() => _IosWebViewScreenState();
}

class _IosWebViewScreenState extends State<IosWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  int _loadingProgress = 0;

  @override
  void initState() {
    super.initState();

    // Tam ekran mod: status bar + navigation bar gizle
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      systemNavigationBarColor: Colors.transparent,
    ));

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF1B5E20))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _isLoading = true);
          },
          onProgress: (progress) {
            if (mounted) setState(() => _loadingProgress = progress);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
          onWebResourceError: (error) {
            debugPrint('WebView hata: ${error.description}');
          },
          // Tüm navigasyona izin ver (harici linkler dahil)
          onNavigationRequest: (request) => NavigationDecision.navigate,
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  void dispose() {
    // Sistem UI'ı geri getir (gerekirse)
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual,
        overlays: SystemUiOverlay.values);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        // AppBar yok → navigation bar gizli
        body: Stack(
          children: [
            // ── WebView ────────────────────────────────────────────────────
            WebViewWidget(controller: _controller),

            // ── Yükleniyor göstergesi ──────────────────────────────────────
            if (_isLoading)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: LinearProgressIndicator(
                  value: _loadingProgress / 100,
                  minHeight: 3,
                  backgroundColor: Colors.transparent,
                  valueColor:
                      const AlwaysStoppedAnimation<Color>(Color(0xFF4CAF50)),
                ),
              ),

            // ── İlk yükleme overlay'i (tam ekran) ─────────────────────────
            if (_isLoading && _loadingProgress < 10)
              Container(
                color: const Color(0xFF1B5E20),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Image.asset(
                        'assets/images/logo.png',
                        width: 90,
                        height: 90,
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Temiz Dünya',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        '🌱 Yükleniyor...',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 32),
                      const SizedBox(
                        width: 36,
                        height: 36,
                        child: CircularProgressIndicator(
                          strokeWidth: 3,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
