import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'user_score.dart';
import 'theme.dart';
import 'scoring_algorithm.dart';

class RankingsScreen extends StatefulWidget {
  @override
  _RankingsScreenState createState() => _RankingsScreenState();
}

class _RankingsScreenState extends State<RankingsScreen> {
  String selectedPeriod = 'all';
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('🏆 Lider Tablosu'),
        centerTitle: true,
        elevation: 0,
      ),
      body: Column(
        children: [
          // 📊 Zaman Seçici
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: SegmentedButton<String>(
              segments: [
                ButtonSegment(
                  value: 'week',
                  label: Text('📅 Haftalık'),
                  icon: Icon(Icons.calendar_today),
                ),
                ButtonSegment(
                  value: 'month',
                  label: Text('📆 Aylık'),
                  icon: Icon(Icons.date_range),
                ),
                ButtonSegment(
                  value: 'all',
                  label: Text('🎯 Tümü'),
                  icon: Icon(Icons.public),
                ),
              ],
              selected: {selectedPeriod},
              onSelectionChanged: (Set<String> newSelection) {
                setState(() => selectedPeriod = newSelection.first);
              },
            ),
          ),
          
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: _db.collection('user_scores')
                  .orderBy('totalScore', descending: true)
                  .limit(50)
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation(AppTheme.primaryColor),
                    ),
                  );
                }
                
                if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.trending_up, size: 48, color: Colors.grey[300]),
                        SizedBox(height: 16),
                        Text(
                          'Henüz sıralama verisi yok.',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  );
                }

                final docs = snapshot.data!.docs;
                
                return ListView.builder(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  itemCount: docs.length,
                  itemBuilder: (context, index) {
                    final doc = docs[index];
                    final data = doc.data() as Map<String, dynamic>;
                    
                    final userScore = UserScore(
                      userId: doc.id,
                      userName: data['userName'] ?? data['displayName'] ?? 'Anonim',
                      ecoPoints: (data['totalScore'] ?? 0).toDouble(),
                      cleanupCount: data['cleanupCount'] ?? 0,
                      groupCount: data['groupCount'] ?? 0,
                      lastActive: (data['lastActive'] as Timestamp?)?.toDate() ?? DateTime.now(),
                    );

                    final rank = index + 1;
                    final isTopThree = rank <= 3;
                    final badge = data['badge'] ?? 'bronze';
                    final level = data['level'] ?? 'novice';
                    final achievements = List<String>.from(data['achievements'] ?? []);
                    
                    return _buildRankingCard(
                      rank: rank,
                      userScore: userScore,
                      isTopThree: isTopThree,
                      index: index,
                      badge: badge,
                      level: level,
                      achievements: achievements,
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  String _getBadgeEmoji(String badge) {
    switch (badge) {
      case 'silver':
        return '🥈';
      case 'gold':
        return '🥇';
      case 'platinum':
        return '💎';
      case 'bronze':
      default:
        return '🥉';
    }
  }

  String _getLevelEmoji(String level) {
    switch (level) {
      case 'beginner':
        return '🌱';
      case 'intermediate':
        return '🔥';
      case 'pro':
        return '⚡';
      case 'expert':
        return '🌟';
      case 'master':
        return '👑';
      case 'novice':
      default:
        return '🎯';
    }
  }
  
  Widget _buildRankingCard({
    required int rank,
    required UserScore userScore,
    required bool isTopThree,
    required int index,
    required String badge,
    required String level,
    required List<String> achievements,
  }) {
    Color getMedalColor() {
      switch (rank) {
        case 1:
          return Color(0xFFFFD700); // Altın
        case 2:
          return Color(0xFFC0C0C0); // Gümüş
        case 3:
          return Color(0xFFCD7F32); // Bronz
        default:
          return AppTheme.primaryColor;
      }
    }

    String getMedalEmoji() {
      switch (rank) {
        case 1:
          return '🥇';
        case 2:
          return '🥈';
        case 3:
          return '🥉';
        default:
          return '';
      }
    }

    return Container(
      margin: EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('${userScore.userName} - ${userScore.ecoPoints.toInt()} EP'),
                duration: Duration(milliseconds: 1500),
              ),
            );
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: isTopThree
                  ? LinearGradient(
                      colors: [
                        getMedalColor().withOpacity(0.15),
                        getMedalColor().withOpacity(0.05),
                      ],
                    )
                  : LinearGradient(
                      colors: [
                        Colors.grey[50]!,
                        Colors.grey[100]!,
                      ],
                    ),
              border: Border.all(
                color: isTopThree ? getMedalColor().withOpacity(0.3) : Colors.grey[200]!,
                width: 1.5,
              ),
              boxShadow: isTopThree
                  ? [
                      BoxShadow(
                        color: getMedalColor().withOpacity(0.15),
                        blurRadius: 8,
                        offset: Offset(0, 4),
                      ),
                    ]
                  : [],
            ),
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  // Rank Badge
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: isTopThree
                          ? LinearGradient(
                              colors: [
                                getMedalColor(),
                                getMedalColor().withOpacity(0.7),
                              ],
                            )
                          : LinearGradient(
                              colors: [
                                AppTheme.primaryLight,
                                AppTheme.primaryColor,
                              ],
                            ),
                      boxShadow: [
                        BoxShadow(
                          color: getMedalColor().withOpacity(0.3),
                          blurRadius: 8,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        isTopThree ? getMedalEmoji() : '$rank',
                        style: TextStyle(
                          fontSize: isTopThree ? 24 : 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  SizedBox(width: 14),
                  
                  // Kullanıcı Bilgileri
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          userScore.userName,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ).animate().fadeIn().slide(begin: Offset(-0.2, 0), end: Offset.zero, duration: Duration(milliseconds: 400), delay: Duration(milliseconds: 50 * index)),
                        SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(Icons.emoji_events, size: 13, color: Colors.grey[500]),
                            SizedBox(width: 4),
                            Text(
                              '${userScore.ecoPoints.toInt()} EP',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey[600],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            SizedBox(width: 10),
                            Icon(Icons.cleaning_services, size: 13, color: Colors.grey[500]),
                            SizedBox(width: 4),
                            Text(
                              '${userScore.cleanupCount} görev',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  SizedBox(width: 10),
                  
                  // Badge ve Level
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Tooltip(
                        message: '$badge - $level',
                        child: Row(
                          children: [
                            Text(_getBadgeEmoji(badge), style: TextStyle(fontSize: 18)),
                            SizedBox(width: 4),
                            Text(_getLevelEmoji(level), style: TextStyle(fontSize: 18)),
                          ],
                        ),
                      ),
                      if (achievements.isNotEmpty)
                        SizedBox(height: 2),
                      if (achievements.isNotEmpty)
                        Text(
                          '${achievements.length}',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: Colors.amber[700],
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(
          duration: Duration(milliseconds: 400),
          delay: Duration(milliseconds: 50 * index),
        )
        .slide(begin: Offset(-0.2, 0), end: Offset.zero, duration: Duration(milliseconds: 400), delay: Duration(milliseconds: 50 * index));
  }
}
