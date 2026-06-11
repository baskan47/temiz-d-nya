import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'models.dart';
import 'firestore_service.dart';
import 'theme.dart';
import 'neomorphic_components.dart';
import 'animation_utils.dart';
import 'scoring_algorithm.dart';

class EcoMarketScreen extends StatefulWidget {
  const EcoMarketScreen({Key? key}) : super(key: key);

  @override
  State<EcoMarketScreen> createState() => _EcoMarketScreenState();
}

class _EcoMarketScreenState extends State<EcoMarketScreen> {
  final FirestoreService _firestoreService = FirestoreService();

  int _getNumericLevel(double points) {
    if (points >= 5000) return 6;
    if (points >= 2000) return 5;
    if (points >= 1000) return 4;
    if (points >= 500) return 3;
    if (points >= 100) return 2;
    return 1;
  }

  double _getLevelProgress(double points, int level) {
    double currentMin = 0;
    double nextMin = 100;
    
    switch (level) {
      case 1:
        currentMin = 0;
        nextMin = 100;
        break;
      case 2:
        currentMin = 100;
        nextMin = 500;
        break;
      case 3:
        currentMin = 500;
        nextMin = 1000;
        break;
      case 4:
        currentMin = 1000;
        nextMin = 2000;
        break;
      case 5:
        currentMin = 2000;
        nextMin = 5000;
        break;
      case 6:
        return 1.0;
    }
    
    return ((points - currentMin) / (nextMin - currentMin)).clamp(0.0, 1.0);
  }

  double _getPointsNeededForNextLevel(double points, int level) {
    switch (level) {
      case 1: return 100 - points;
      case 2: return 500 - points;
      case 3: return 1000 - points;
      case 4: return 2000 - points;
      case 5: return 5000 - points;
      default: return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final firebaseUser = Provider.of<User?>(context);
    final userId = firebaseUser?.uid ?? 'TEST_USER_AURA_1';
    
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Eco-Market',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
      ),
      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance.collection('users').doc(userId).snapshots(),
          builder: (context, userSnapshot) {
            // Setup fallback user values if document doesn't exist
            Map<String, dynamic> userData = {
              'name': 'Doğa Sever',
              'ecoPoints': 0.0,
              'trust_score': 50,
            };
            
            if (userSnapshot.hasData && userSnapshot.data!.exists) {
              userData = userSnapshot.data!.data() as Map<String, dynamic>;
            }

            final double userPoints = (userData['ecoPoints'] ?? 0.0).toDouble();
            final String userName = userData['name'] ?? userData['displayName'] ?? 'Doğa Sever';
            final int trustScore = (userData['trust_score'] ?? 50).toInt();

            return OrientationBuilder(
              builder: (context, orientation) {
                final isLandscape = orientation == Orientation.landscape;

                if (isLandscape) {
                  // Yatay Split-View (%35 Sol, %65 Sağ)
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Sol Cüzdan ve Durum Paneli (%35)
                      Expanded(
                        flex: 35,
                        child: Container(
                          decoration: BoxDecoration(
                            border: Border(
                              right: BorderSide(
                                color: isDark ? Colors.grey[800]! : Colors.grey[200]!,
                                width: 1,
                              ),
                            ),
                          ),
                          child: _buildLeftPanel(userId, userName, userPoints, trustScore, isDark),
                        ),
                      ),
                      // Sağ Hediye Grid Paneli (%65)
                      Expanded(
                        flex: 65,
                        child: _buildRightPanel(userId, userPoints, isDark),
                      ),
                    ],
                  );
                } else {
                  // Dikey Düzen (Dikey modda alt alta gösterim)
                  return SingleChildScrollView(
                    child: Column(
                      children: [
                        _buildLeftPanel(userId, userName, userPoints, trustScore, isDark),
                        const Divider(height: 1),
                        SizedBox(
                          height: 500,
                          child: _buildRightPanel(userId, userPoints, isDark),
                        ),
                      ],
                    ),
                  );
                }
              },
            );
          },
        ),
      ),
    );
  }

  // Sol Panel: Cüzdan, CO2 Tasarrufu ve İşlem Geçmişi
  Widget _buildLeftPanel(
    String userId,
    String userName,
    double points,
    int trustScore,
    bool isDark,
  ) {
    // CO2 saved: 0.05 kg CO2 per Eco-Point
    final double co2Saved = points * 0.05;
    final int level = _getNumericLevel(points);
    final String badgeLabel = AdvancedScoringAlgorithm.determineLevel(points).toUpperCase();
    final String badge = '${AdvancedScoringAlgorithm.determineBadge(points).toUpperCase()} - $badgeLabel';

    // Calculate level progress
    final double levelProgress = _getLevelProgress(points, level);
    final double pointsNeeded = _getPointsNeededForNextLevel(points, level);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Frosted glass effect wallet card
          NeumorphicCard(
            borderRadius: 24,
            backgroundColor: isDark ? const Color(0xFF1F2937) : Colors.white,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Eco-Bakiye',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[500],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Seviye $level',
                        style: GoogleFonts.poppins(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${points.toStringAsFixed(1)} EP',
                  style: GoogleFonts.poppins(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                // Level progress bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: levelProgress,
                    minHeight: 6,
                    backgroundColor: isDark ? Colors.grey[800] : Colors.grey[200],
                    valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryLight),
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      badge,
                      style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey[500]),
                    ),
                    Text(
                      level >= 6 ? 'Maksimum Seviye' : 'Sonraki Seviye: ${pointsNeeded.toStringAsFixed(0)} EP',
                      style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[500]),
                    ),
                  ],
                ),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms).scale(),

          const SizedBox(height: 16),

          // CO2 Impact Indicator
          NeumorphicCard(
            borderRadius: 16,
            backgroundColor: isDark ? const Color(0xFF1F2937) : Colors.white,
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.co2, color: AppTheme.successColor, size: 28),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Kurtarılan Karbon Salınımı',
                        style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[500]),
                      ),
                      Text(
                        '${co2Saved.toStringAsFixed(2)} kg CO2',
                        style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 100.ms, duration: 400.ms),

          const SizedBox(height: 24),
          
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Puan Geçmişi',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Icon(Icons.history, size: 18, color: Colors.grey[400]),
            ],
          ),
          const SizedBox(height: 12),

          // Transactions Stream
          StreamBuilder<List<PointTransaction>>(
            stream: _firestoreService.watchUserTransactions(userId),
            builder: (context, txSnapshot) {
              if (txSnapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: CircularProgressIndicator(strokeWidth: 2),
                ));
              }

              final transactions = txSnapshot.data ?? [];

              if (transactions.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      'İşlem geçmişi bulunmuyor.',
                      style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[500]),
                    ),
                  ),
                );
              }

              return ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: transactions.length.clamp(0, 5), // Show last 5
                itemBuilder: (context, index) {
                  final tx = transactions[index];
                  final isEarn = tx.type == 'earn';

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: isEarn
                                ? Colors.green.withOpacity(0.1)
                                : Colors.red.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            isEarn ? Icons.add_circle_outline : Icons.remove_circle_outline,
                            color: isEarn ? Colors.green : Colors.red,
                            size: 16,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _getTransactionSourceText(tx.source),
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                '${tx.timestamp.day}/${tx.timestamp.month}/${tx.timestamp.year}',
                                style: GoogleFonts.poppins(
                                  fontSize: 10,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '${isEarn ? "+" : ""}${tx.pointsAmount.toStringAsFixed(0)} EP',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isEarn ? Colors.green[600] : Colors.red[600],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }

  // Sağ Panel: Hediye Kataloğu Grid
  Widget _buildRightPanel(String userId, double userPoints, bool isDark) {
    return StreamBuilder<List<RewardItem>>(
      stream: _firestoreService.watchRewardsCatalog(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Center(child: AnimationUtils.loadingSpinner(color: AppTheme.primaryColor));
        }

        final rewards = snapshot.data ?? [];

        if (rewards.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shopping_bag_outlined, size: 60, color: Colors.grey[400]),
                  const SizedBox(height: 12),
                  Text(
                    'Katalog Boş',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Text(
                    'Aktif market ürünü bulunmamaktadır.',
                    style: GoogleFonts.poppins(color: Colors.grey[500], fontSize: 12),
                  ),
                ],
              ),
            ),
          );
        }

        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Ödül Kataloğu',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 0.82,
                  ),
                  itemCount: rewards.length,
                  itemBuilder: (context, index) {
                    final reward = rewards[index];
                    final canAfford = userPoints >= reward.pointsCost;
                    final hasStock = reward.stock > 0;

                    return NeumorphicCard(
                      borderRadius: 20,
                      backgroundColor: isDark ? const Color(0xFF1F2937) : Colors.white,
                      padding: EdgeInsets.zero,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Image
                          Expanded(
                            flex: 50,
                            child: ClipRRect(
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(20),
                                topRight: Radius.circular(20),
                              ),
                              child: Stack(
                                children: [
                                  Image.network(
                                    reward.imageUrl.isNotEmpty
                                        ? reward.imageUrl
                                        : 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500',
                                    fit: BoxFit.cover,
                                    width: double.infinity,
                                    height: double.infinity,
                                    errorBuilder: (context, error, stackTrace) => Container(
                                      color: isDark ? Colors.grey[800] : Colors.grey[200],
                                      child: Icon(Icons.card_giftcard, size: 40, color: Colors.grey[400]),
                                    ),
                                  ),
                                  // Stock indicator banner
                                  if (!hasStock)
                                    Positioned.fill(
                                      child: Container(
                                        color: Colors.black.withOpacity(0.6),
                                        alignment: Alignment.center,
                                        child: Text(
                                          'TÜKENDİ',
                                          style: GoogleFonts.poppins(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                    )
                                  else if (reward.stock <= 5)
                                    Positioned(
                                      top: 8,
                                      right: 8,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: Colors.orange,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          'Son ${reward.stock} Ürün!',
                                          style: GoogleFonts.poppins(
                                            fontSize: 9,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                          // Details
                          Expanded(
                            flex: 50,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    reward.provider,
                                    style: GoogleFonts.poppins(
                                      fontSize: 9,
                                      color: AppTheme.primaryColor,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    reward.title,
                                    style: GoogleFonts.poppins(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    reward.description,
                                    style: GoogleFonts.poppins(
                                      fontSize: 9,
                                      color: Colors.grey[500],
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const Spacer(),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '${reward.pointsCost} EP',
                                        style: GoogleFonts.poppins(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                          color: canAfford ? Colors.green[600] : Colors.red[600],
                                        ),
                                      ),
                                      SizedBox(
                                        height: 28,
                                        child: ElevatedButton(
                                          onPressed: hasStock && canAfford
                                              ? () => _showRedemptionDialog(context, userId, reward)
                                              : null,
                                          style: ElevatedButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(horizontal: 10),
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            backgroundColor: AppTheme.primaryColor,
                                          ),
                                          child: Text(
                                            'Al',
                                            style: GoogleFonts.poppins(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _getTransactionSourceText(String source) {
    switch (source) {
      case 'cleanup_session':
        return 'Çevre Temizlik Etkinliği';
      case 'recycled_at_device':
        return 'Otonom Cihaz Depozitosu';
      case 'spend_reward':
        return 'Ödül Satın Alımı';
      case 'bonus_streak':
        return 'Seri Temizlik Bonusu';
      case 'admin_award':
        return 'Yönetici Ödülü';
      default:
        return 'Eco-Puan İşlemi';
    }
  }

  void _showRedemptionDialog(BuildContext context, String userId, RewardItem reward) {
    final TextEditingController addressController = TextEditingController();
    bool isLoading = false;
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Row(
                children: [
                  const Icon(Icons.redeem, color: AppTheme.primaryColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Satın Alma Onayı',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ),
                ],
              ),
              content: isLoading
                  ? Container(
                      height: 150,
                      alignment: Alignment.center,
                      child: AnimationUtils.loadingSpinner(color: AppTheme.primaryColor),
                    )
                  : Form(
                      key: formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            reward.title,
                            style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          Text(
                            'Sağlayıcı: ${reward.provider}',
                            style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Bu işlem bakiyenizden ${reward.pointsCost} Eco-Puan düşecektir.',
                            style: GoogleFonts.poppins(fontSize: 12),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: addressController,
                            maxLines: 2,
                            decoration: InputDecoration(
                              labelText: 'Teslimat Adresi',
                              hintText: 'Sokak, Mahalle, İlçe/Şehir bilgilerini giriniz.',
                              labelStyle: GoogleFonts.poppins(fontSize: 12),
                              hintStyle: GoogleFonts.poppins(fontSize: 11),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Adres alanı boş bırakılamaz.';
                              }
                              if (value.trim().length < 15) {
                                return 'Lütfen detaylı bir adres giriniz.';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
              actions: isLoading
                  ? []
                  : [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('İptal'),
                      ),
                      ElevatedButton(
                        onPressed: () async {
                          if (formKey.currentState!.validate()) {
                            setDialogState(() => isLoading = true);

                            try {
                              await _firestoreService.redeemReward(
                                userId: userId,
                                rewardId: reward.id,
                                pointsCost: reward.pointsCost,
                                shippingAddress: {
                                  'full_address': addressController.text.trim(),
                                  'city': 'Istanbul', // Simplified for simulation
                                },
                              );

                              if (mounted) {
                                Navigator.pop(context); // Close dialog
                                _showRedeemSuccess(context, reward);
                              }
                            } catch (e) {
                              if (mounted) {
                                Navigator.pop(context); // Close dialog
                                _showRedeemFailure(context, e.toString());
                              }
                            }
                          }
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                        child: const Text('Onayla ve Al', style: TextStyle(color: Colors.white)),
                      ),
                    ],
            );
          },
        );
      },
    );
  }

  void _showRedeemSuccess(BuildContext context, RewardItem reward) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimationUtils.celebrationAnimation(width: 100, height: 100),
            const SizedBox(height: 16),
            Text(
              'Ödül Alındı!',
              style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green),
            ),
            const SizedBox(height: 8),
            Text(
              '${reward.title} siparişiniz oluşturuldu. Adresinize ulaştığında kargo takip kodu SMS olarak gönderilecektir.',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(fontSize: 12),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
            child: const Text('Tamam', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showRedeemFailure(BuildContext context, String errorMessage) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimationUtils.errorMark(size: 80),
            const SizedBox(height: 16),
            Text(
              'Talep Başarısız!',
              style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.red),
            ),
            const SizedBox(height: 8),
            Text(
              errorMessage.replaceAll('Exception:', ''),
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(fontSize: 12, color: Colors.red[800]),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Kapat', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
