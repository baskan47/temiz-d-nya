import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'theme.dart';
import 'dialogs.dart';

class MobileScoresScreenImproved extends StatefulWidget {
  @override
  _MobileScoresScreenImprovedState createState() => _MobileScoresScreenImprovedState();
}

class _MobileScoresScreenImprovedState extends State<MobileScoresScreenImproved> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  late User? _currentUser;

  @override
  void initState() {
    super.initState();
    _currentUser = Provider.of<User?>(context, listen: false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('🏆 EcoPoints & Başarılar'),
        centerTitle: true,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.info_outline),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => CustomAlertDialog(
                  title: 'EcoPoints Hakkında',
                  message: 'EcoPoints, her temizlik görevini tamamladığında kazandığınız puanlardır. Puan topladıkça yeni başarılar açılır!',
                  positiveButtonText: 'Anladım',
                  onPositive: () {},
                  icon: Icons.star,
                  iconColor: AppTheme.tertiaryColor,
                ),
              );
            },
          ),
        ],
      ),
      body: _currentUser == null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_outline, size: 48, color: Colors.grey[400]),
                  SizedBox(height: 16),
                  Text('Oturum açınız', style: TextStyle(fontSize: 16, color: Colors.grey[600])),
                ],
              ),
            )
          : StreamBuilder<DocumentSnapshot>(
              stream: _firestore.collection('users').doc(_currentUser!.uid).snapshots(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation(AppTheme.primaryColor),
                    ),
                  );
                }

                if (!snapshot.hasData || !snapshot.data!.exists) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search_off, size: 48, color: Colors.grey[400]),
                        SizedBox(height: 16),
                        Text('Veri bulunamadı', style: TextStyle(fontSize: 16, color: Colors.grey[600])),
                      ],
                    ),
                  );
                }

                final userData = snapshot.data!.data() as Map<String, dynamic>;
                final ecoPoints = userData['ecoPoints'] ?? 0.0;
                final cleanupCount = userData['cleanupCount'] ?? 0;
                final groupCount = userData['groupCount'] ?? 0;
                final weeklyPoints = userData['weeklyPoints'] ?? 0.0;

                return SingleChildScrollView(
                  physics: BouncingScrollPhysics(),
                  child: Column(
                    children: [
                      SizedBox(height: 8),
                      _buildPointsHeader(ecoPoints),
                      SizedBox(height: 24),
                      _buildProgressSection(ecoPoints),
                      SizedBox(height: 24),
                      _buildStatsGrid(cleanupCount, groupCount, weeklyPoints),
                      SizedBox(height: 24),
                      _buildBadgesSection(ecoPoints),
                      SizedBox(height: 24),
                      _buildLeaderboardPreview(),
                      SizedBox(height: 32),
                    ],
                  ),
                );
              },
            ),
    );
  }

  Widget _buildPointsHeader(double points) {
    final nextLevel = ((points ~/ 1000) + 1) * 1000;
    final progress = (points % 1000) / 1000;

    return Container(
      margin: EdgeInsets.all(16),
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.primaryColor,
            AppTheme.primaryLight,
            AppTheme.secondaryColor,
          ],
          stops: [0.0, 0.5, 1.0],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withOpacity(0.3),
            blurRadius: 16,
            offset: Offset(0, 8),
            spreadRadius: 4,
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            '💚 TOPLAM ECO POINTS',
            style: TextStyle(
              fontSize: 11,
              color: Colors.white70,
              letterSpacing: 2,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: 12),
          Text(
            '${points.toInt()}',
            style: TextStyle(
              fontSize: 64,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: 1,
              shadows: [
                Shadow(
                  color: Colors.black.withOpacity(0.2),
                  offset: Offset(0, 4),
                  blurRadius: 8,
                ),
              ],
            ),
          )
              .animate()
              .scaleXY(duration: Duration(milliseconds: 600), begin: 0.9)
              .fadeIn(),
          SizedBox(height: 16),
          Text(
            _getBadgeTier(points),
            style: TextStyle(
              color: Colors.white70,
              fontSize: 15,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: 100))
        .slide(begin: Offset(0, -0.2), end: Offset.zero, duration: Duration(milliseconds: 600));
  }

  Widget _buildProgressSection(double points) {
    final nextLevel = ((points ~/ 1000) + 1) * 1000;
    final progress = (points % 1000) / 1000;

    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey[200]!, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Sonraki Seviye',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[700],
                  letterSpacing: 0.3,
                ),
              ),
              Text(
                '${(progress * 100).toInt()}%',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryColor,
                ),
              ),
            ],
          ),
          SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 10,
              backgroundColor: Colors.grey[200],
              valueColor: AlwaysStoppedAnimation(
                LinearGradient(
                  colors: [AppTheme.primaryLight, AppTheme.secondaryColor],
                ).colors[0],
              ),
            ),
          ),
          SizedBox(height: 10),
          Text(
            '${points.toInt()} / ${nextLevel.toInt()} EP',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: 200))
        .slide(begin: Offset(0, 0.2), end: Offset.zero, duration: Duration(milliseconds: 600));
  }

  Widget _buildStatsGrid(int cleanups, int groups, double weekly) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: NeverScrollableScrollPhysics(),
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        children: [
          _buildStatCard('Temizlikler', cleanups, Icons.cleaning_services),
          _buildStatCard('Gruplar', groups, Icons.group),
          _buildStatCard('Haftalık', weekly.toInt(), Icons.trending_up),
          _buildStatCard('Sıra', 42, Icons.leaderboard),
        ],
      ),
    );
  }

  Widget _buildLeaderboardPreview() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey[200]!, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '📊 Lider Tablosu',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryDark,
                ),
              ),
              Icon(Icons.arrow_forward, size: 18, color: AppTheme.primaryColor),
            ],
          ),
          SizedBox(height: 12),
          Text(
            'En iyi 3 gönüllüyü görmek için lider tablosuna git.',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: 400))
        .slide(begin: Offset(0, 0.3), end: Offset.zero);
  }

  String _getBadgeTier(double points) {
    if (points >= 50000) return '🌍 Dünya Kahramanı';
    if (points >= 20000) return '🏆 Legenda';
    if (points >= 10000) return '💎 Elmas Seviyesi';
    if (points >= 5000) return '🌟 Yıldız Seviyesi';
    if (points >= 2000) return '👑 Lider';
    if (points >= 1000) return '🥇 Expert';
    if (points >= 500) return '🥈 Katılımcı';
    return '🥉 Başlangıç';
  }

  Widget _buildStatCard(String label, int value, IconData icon) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 32, color: AppTheme.primaryColor),
          SizedBox(height: 8),
          Text(
            value.toString(),
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryColor,
            ),
          ),
          SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: 200))
        .slide(begin: Offset(0, 0.2), end: Offset.zero);
  }

  Widget _buildBadgesSection(double points) {
    final badges = _calculateBadges(points);

    return Column(
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'ROZETLER VE BAŞARILAR',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
              letterSpacing: 1.5,
            ),
          ),
        ),
        SizedBox(height: 12),
        Container(
          margin: EdgeInsets.symmetric(horizontal: 16),
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black12,
                blurRadius: 8,
              ),
            ],
          ),
          child: GridView.count(
            crossAxisCount: 4,
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            children: badges,
          ),
        ),
      ],
    );
  }

  List<Widget> _calculateBadges(double points) {
    final badgeConfigs = [
      {'emoji': '🥉', 'label': 'Başlangıç', 'unlocked': points >= 200},
      {'emoji': '🥈', 'label': 'Katılımcı', 'unlocked': points >= 500},
      {'emoji': '🥇', 'label': 'Expert', 'unlocked': points >= 1000},
      {'emoji': '👑', 'label': 'Lider', 'unlocked': points >= 2000},
      {'emoji': '🌟', 'label': 'Yıldız', 'unlocked': points >= 5000},
      {'emoji': '💎', 'label': 'Elmas', 'unlocked': points >= 10000},
      {'emoji': '🏆', 'label': 'Legenda', 'unlocked': points >= 20000},
      {'emoji': '🌍', 'label': 'Kahramanı', 'unlocked': points >= 50000},
    ];

    return badgeConfigs
        .asMap()
        .entries
        .map((entry) {
          final index = entry.key;
          final config = entry.value;
          final unlocked = config['unlocked'] as bool;

          return Container(
            decoration: BoxDecoration(
              color: unlocked
                  ? Colors.amber.withValues(alpha: 0.1)
                  : Colors.grey.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: unlocked ? Colors.amber : Colors.grey[300]!,
                width: 2,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  config['emoji'] as String,
                  style: TextStyle(fontSize: 24),
                ),
                SizedBox(height: 4),
                Text(
                  config['label'] as String,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: unlocked ? Colors.amber[900] : Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          )
              .animate()
              .fadeIn(delay: Duration(milliseconds: 100 * index))
              .scale(delay: Duration(milliseconds: 100 * index));
        })
        .toList();
  }
}
