import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'theme.dart';

import 'friends_screen.dart';
import 'dirty_areas_map_screen.dart';
import 'points_detail_screen.dart';
import 'nearby_operations_screen.dart';
import 'language_provider.dart';
import 'autonomous_device_list_screen.dart';
import 'eco_market_screen.dart';

class MobileHomeImproved extends StatefulWidget {
  final Function(int)? onNavigate;

  MobileHomeImproved({this.onNavigate});

  @override
  _MobileHomeImprovedState createState() => _MobileHomeImprovedState();
}

class _MobileHomeImprovedState extends State<MobileHomeImproved> with TickerProviderStateMixin {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<User?>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF0F2F5),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // 🚀 HEADER: Modern Logo & Title
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 60, 20, 40),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(50),
                  bottomRight: Radius.circular(50),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 30,
                    offset: const Offset(0, 15),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Modern Minimalist Logo (Custom Drawn)
                  _buildModernLogo(),
                  const SizedBox(height: 25),
                  Text(
                    context.watch<LanguageProvider>().translate('slogan'),
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: const Color(0xFF1B6E4F),
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 15),
                  // Carbon Metric
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(25),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.eco_rounded, color: Color(0xFF2E7D32), size: 20),
                        const SizedBox(width: 10),
                        Text(
                          "${context.watch<LanguageProvider>().translate('carbon_offset')}: 124.5 kg",
                          style: TextStyle(
                            color: Colors.green[900],
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ).animate().fadeIn().slideY(begin: 0.2),
                ],
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                const SizedBox(height: 10),
                
                // 📊 MAIN ACTIONS: Integrated Cards (Responsive)
                LayoutBuilder(
                  builder: (context, constraints) {
                    final int crossAxisCount = constraints.maxWidth > 600 ? 3 : 2;
                    return GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: crossAxisCount,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 1.1,
                      children: [
                    // Card 1: Arkadaşlar (+)
                    _buildIntegratedCard(
                      context,
                      icon: Icons.people_alt_rounded,
                      label: context.watch<LanguageProvider>().translate('friends'),
                      value: "24",
                      accentColor: Colors.blue,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => FriendsScreen())),
                      hasAddButton: true,
                    ),

                    // Card 2: Kirli Alanlar
                    StreamBuilder<QuerySnapshot>(
                      stream: _db.collection('reports').snapshots(),
                      builder: (context, snapshot) {
                        String count = snapshot.hasData ? snapshot.data!.docs.length.toString() : "12";
                        return _buildIntegratedCard(
                          context,
                          icon: Icons.location_on_rounded,
                          label: context.watch<LanguageProvider>().translate('dirty_areas'),
                          value: count,
                          accentColor: Colors.orange,
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => DirtyAreasMapScreen())),
                        );
                      },
                    ),

                    // Card 3: Toplam Puanın (High Visibility)
                    StreamBuilder<DocumentSnapshot>(
                      stream: user != null ? _db.collection('users').doc(user.uid).snapshots() : null,
                      builder: (context, snapshot) {
                        String points = "1450";
                        if (snapshot.hasData && snapshot.data!.exists) {
                          points = (snapshot.data!.data() as Map<String, dynamic>)['ecoPoints']?.toInt().toString() ?? "1450";
                        }
                        return _buildIntegratedCard(
                          context,
                          icon: Icons.emoji_events_rounded,
                          label: context.watch<LanguageProvider>().translate('total_points'),
                          value: points,
                          accentColor: Colors.green,
                          isProminent: true,
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => PointsDetailScreen())),
                        );
                      },
                    ),

                    // Card 4: Atık (kg) (High Visibility)
                    _buildIntegratedCard(
                      context,
                      icon: Icons.delete_sweep_rounded,
                      label: context.watch<LanguageProvider>().translate('waste_kg'),
                      value: "12.4",
                      accentColor: Colors.red,
                      isProminent: true,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => PointsDetailScreen())),
                    ),

                    // Card 5: Otonom Cihazlar (Smart Bins)
                    StreamBuilder<QuerySnapshot>(
                      stream: _db.collection('autonomous_devices').snapshots(),
                      builder: (context, snapshot) {
                        String count = snapshot.hasData ? snapshot.data!.docs.length.toString() : "...";
                        return _buildIntegratedCard(
                          context,
                          icon: Icons.sensors_rounded,
                          label: context.watch<LanguageProvider>().translate('otonom_cihazlar'),
                          value: count,
                          accentColor: Colors.teal,
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const AutonomousDeviceListScreen())),
                        );
                      },
                    ),

                    // Card 6: Eco-Market
                    StreamBuilder<QuerySnapshot>(
                      stream: _db.collection('rewards_catalog').where('is_active', isEqualTo: true).snapshots(),
                      builder: (context, snapshot) {
                        String count = snapshot.hasData ? snapshot.data!.docs.length.toString() : "...";
                        return _buildIntegratedCard(
                          context,
                          icon: Icons.storefront_rounded,
                          label: context.watch<LanguageProvider>().translate('eco_market'),
                          value: count,
                          accentColor: Colors.deepPurple,
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const EcoMarketScreen())),
                        );
                      },
                    ),
                  ],
                    );
                  },
                ),

                const SizedBox(height: 35),

                // ⚡ QUICK ACTIONS
                Row(
                  children: [
                    const Icon(Icons.bolt_rounded, color: Colors.amber, size: 28),
                    const SizedBox(width: 10),
                    Text(
                      context.watch<LanguageProvider>().translate('quick_actions'),
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: -0.5),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: _buildActionBtn(
                        context,
                        Icons.gps_fixed_rounded,
                        context.watch<LanguageProvider>().translate('operation'),
                        const Color(0xFF4FACFE),
                        () => Navigator.push(context, MaterialPageRoute(builder: (context) => NearbyOperationsScreen())),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildActionBtn(
                        context,
                        Icons.add_a_photo_rounded,
                        context.watch<LanguageProvider>().translate('report_pollution'),
                        const Color(0xFFF093FB),
                        () => _showEvidenceBottomSheet(context),
                      ).animate(onPlay: (c) => c.repeat())
                       .shimmer(delay: 2.seconds, duration: 1.5.seconds)
                       .shake(hz: 2, curve: Curves.easeInOut),
                    ),
                  ],
                ),

                const SizedBox(height: 40),

                // 🔴 LIVE ACTIVITY
                Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: Colors.red.withOpacity(0.4), blurRadius: 6, spreadRadius: 2)
                        ],
                      ),
                    ).animate(onPlay: (c) => c.repeat()).scale(duration: 1.seconds, curve: Curves.easeInOut).fadeOut(),
                    const SizedBox(width: 10),
                    Text(
                      context.watch<LanguageProvider>().translate('live_activity'),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                _buildActivityItem(context, 'Baran A.', context.watch<LanguageProvider>().translate('cleaned_beach'), '2 dk ${context.watch<LanguageProvider>().translate('ago')}', '+50'),
                _buildActivityItem(context, 'Merve Y.', context.watch<LanguageProvider>().translate('added_new_report'), '5 dk ${context.watch<LanguageProvider>().translate('ago')}', '+10'),
                _buildActivityItem(context, 'Grup Doğa', '15kg ${context.watch<LanguageProvider>().translate('collected_plastic')}', '10 dk ${context.watch<LanguageProvider>().translate('ago')}', '+150'),
                
                const SizedBox(height: 100), // Bottom spacing
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModernLogo() {
    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.green.withOpacity(0.15),
            blurRadius: 40,
            spreadRadius: 10,
          ),
        ],
      ),
        child: Container(
          margin: const EdgeInsets.all(10),
          decoration: const BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
          ),
          child: ClipOval(
            child: Image.asset(
              'assets/images/logo.png',
              width: 90,
              height: 90,
              fit: BoxFit.contain,
            ),
          ),
        ),
    ).animate().scale(duration: 800.ms, curve: Curves.easeOutBack).rotate(begin: -0.1, end: 0);
  }

  Widget _buildIntegratedCard(BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    required Color accentColor,
    required VoidCallback onTap,
    bool hasAddButton = false,
    bool isProminent = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: isProminent ? accentColor.withOpacity(0.15) : Colors.black.withOpacity(0.04),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
          border: isProminent ? Border.all(color: accentColor.withOpacity(0.2), width: 1.5) : null,
        ),
        child: Stack(
          children: [
            // Background Accent Glow
            Positioned(
              right: -20,
              top: -20,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.05),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, color: accentColor, size: 34),
                  const SizedBox(height: 12),
                  Text(
                    label,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        value,
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF2D3436),
                        ),
                      ),
                      if (hasAddButton) ...[
                        const SizedBox(width: 6),
                        Icon(Icons.add_circle_rounded, color: accentColor, size: 20),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ).animate().fadeIn(delay: 100.ms).scale(delay: 100.ms, curve: Curves.easeOut),
    );
  }

  Widget _buildActionBtn(BuildContext context, IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 26, color: color),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityItem(BuildContext context, String user, String action, String time, String points) {
    return GestureDetector(
      onTap: () => _showActivityDetail(context, user, action, time, points),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
              child: Text(user[0], style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(color: Colors.black87, fontSize: 14),
                      children: [
                        TextSpan(text: user, style: const TextStyle(fontWeight: FontWeight.bold)),
                        TextSpan(text: ' $action'),
                      ],
                    ),
                  ),
                  Text(time, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$points EP',
                style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showActivityDetail(BuildContext context, String user, String action, String time, String points) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 30,
              backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
              child: Text(user[0], style: TextStyle(color: AppTheme.primaryColor, fontSize: 20, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 16),
            Text(user, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(action, style: TextStyle(color: Colors.grey[700])),
            const SizedBox(height: 4),
            Text(time, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.eco, color: Colors.green, size: 20),
                const SizedBox(width: 8),
                Text("${context.watch<LanguageProvider>().translate('earned_points')}: $points EP", style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 30),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(context.watch<LanguageProvider>().translate('close')),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (context) => DirtyAreasMapScreen()));
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                    child: Text(context.watch<LanguageProvider>().translate('see_on_map'), style: const TextStyle(color: Colors.white)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  void _showEvidenceBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 24),
            Text(context.watch<LanguageProvider>().translate('upload_evidence'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            ListTile(
              leading: Icon(Icons.add_location_alt_rounded, color: Colors.orange[700]),
              title: Text(context.watch<LanguageProvider>().translate('report_new_dirty_area'), style: const TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const DirtyAreasMapScreen(startReporting: true),
                  ),
                );
              },
            ),
            ListTile(
              leading: Icon(Icons.check_circle_rounded, color: Colors.green[700]),
              title: Text(context.watch<LanguageProvider>().translate('cleaning_completed'), style: const TextStyle(fontWeight: FontWeight.bold)),
              onTap: () => Navigator.pop(context),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
