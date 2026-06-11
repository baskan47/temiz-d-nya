import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme.dart';
import 'neomorphic_components.dart';
import 'language_provider.dart';

class EmergencyPage extends StatefulWidget {
  @override
  _EmergencyPageState createState() => _EmergencyPageState();
}

class _EmergencyPageState extends State<EmergencyPage> {
  bool _isActivated = false;
  int _countdown = 5;

  void _triggerSOS() {
    setState(() {
      _isActivated = true;
      _countdown = 5;
    });
    _tick();
  }

  void _tick() {
    if (!mounted || !_isActivated) return;
    if (_countdown > 0) {
      Future.delayed(Duration(seconds: 1), () {
        if (mounted && _isActivated) {
          setState(() => _countdown--);
          if (_countdown == 0) {
            _showDirectCallInterface();
          } else {
            _tick();
          }
        }
      });
    }
  }

  void _showDirectCallInterface() {
    setState(() => _isActivated = false);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.4,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.phone_in_talk, color: Colors.red, size: 80),
            const SizedBox(height: 20),
            Text(
              context.watch<LanguageProvider>().translate('calling_emergency'),
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 40),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircleAvatar(
                  radius: 35,
                  backgroundColor: Colors.red,
                  child: IconButton(
                    icon: const Icon(Icons.call_end, color: Colors.white, size: 30),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F2F5),
      body: Stack(
        children: [
          // Background Glow for SOS
          if (_isActivated)
            Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [
                    Colors.red.withOpacity(0.3),
                    Colors.transparent,
                  ],
                  radius: 1.5,
                ),
              ),
            ).animate(onPlay: (c) => c.repeat()).scale(
                  begin: const Offset(1, 1),
                  end: const Offset(1.5, 1.5),
                  duration: 1.seconds,
                ).fadeOut(),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 40),
                  Text(
                    context.watch<LanguageProvider>().translate('emergency_sos'),
                    style: GoogleFonts.poppins(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1D1D1F),
                    ),
                  ).animate().fadeIn().slideX(),
                  Text(
                    context.watch<LanguageProvider>().translate('sos_help_desc'),
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      color: Colors.grey[600],
                    ),
                  ).animate().fadeIn(delay: 200.ms),
                  
                  Expanded(
                    child: Center(
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          if (_isActivated)
                            Text(
                              '$_countdown',
                              style: GoogleFonts.poppins(
                                fontSize: 120,
                                fontWeight: FontWeight.bold,
                                color: Colors.red.withOpacity(0.5),
                              ),
                            ).animate().scale(begin: const Offset(0.5, 0.5), end: const Offset(2, 2)).fadeOut(),
                          
                          _buildSOSButton(),
                        ],
                      ),
                    ),
                  ),

                  // Kategori Kartları
                  Text(
                    context.watch<LanguageProvider>().translate('quick_categories'),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1D1D1F),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Container(
                    height: 130,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        _buildCategoryCard(
                          context.watch<LanguageProvider>().translate('forest_fire'),
                          Icons.local_fire_department,
                          Colors.orange,
                          () => _triggerSOS(),
                        ),
                        _buildCategoryCard(
                          context.watch<LanguageProvider>().translate('injury'),
                          Icons.medical_services,
                          Colors.blue,
                          () => _showDirectCallInterface(),
                        ),
                        _buildCategoryCard(
                          context.watch<LanguageProvider>().translate('intense_pollution'),
                          Icons.warning_amber_rounded,
                          Colors.grey,
                          null,
                          isInactive: true,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
          
          if (_isActivated)
            Positioned(
              bottom: 100,
              left: 0,
              right: 0,
              child: Center(
                child: TextButton(
                  onPressed: () => setState(() => _isActivated = false),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(30),
                    ),
                    child: Text(
                      context.watch<LanguageProvider>().translate('cancel').toUpperCase(),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSOSButton() {
    return GestureDetector(
      onTap: _isActivated ? null : _triggerSOS,
      child: Container(
        width: 240,
        height: 240,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: const Color(0xFFF0F2F5),
          boxShadow: [
            BoxShadow(
              color: Colors.white.withOpacity(0.8),
              offset: const Offset(-10, -10),
              blurRadius: 20,
            ),
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              offset: const Offset(10, 10),
              blurRadius: 20,
            ),
            if (_isActivated)
              BoxShadow(
                color: Colors.red.withOpacity(0.5),
                blurRadius: 40,
                spreadRadius: 5,
              ),
          ],
        ),
        child: Center(
          child: Container(
            width: 180,
            height: 180,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFFFF4B2B),
                  Color(0xFFFF416C),
                ],
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.sos, color: Colors.white, size: 80),
                Text(
                  context.watch<LanguageProvider>().translate('call_for_help'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ),
        ),
      ).animate(onPlay: (c) => c.repeat(reverse: true))
       .scale(begin: const Offset(1, 1), end: const Offset(1.02, 1.02), duration: 1.seconds),
    );
  }

  Widget _buildCategoryCard(String title, IconData icon, Color color, VoidCallback? onTap, {bool isInactive = false}) {
    return Container(
      width: 110,
      margin: const EdgeInsets.only(right: 16),
      child: NeumorphicCard(
        padding: const EdgeInsets.all(12),
        backgroundColor: Colors.white,
        onTap: isInactive ? null : onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: isInactive ? Colors.grey : color, size: 28),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isInactive ? Colors.grey : const Color(0xFF1D1D1F),
              ),
            ),
            if (isInactive)
              Padding(
                padding: const EdgeInsets.only(top: 4.0),
                child: Text(
                  context.watch<LanguageProvider>().translate('coming_soon'),
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                ),
              ),
          ],
        ),
      ),
    ).animate().fadeIn().slideY(begin: 0.2);
  }
}
