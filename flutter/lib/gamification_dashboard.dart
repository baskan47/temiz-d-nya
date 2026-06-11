import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'language_provider.dart';
import 'gamification_engine.dart';
import 'shareable_badge_card.dart';
import 'wallet_screen.dart';

class GamificationDashboard extends StatelessWidget {
  final UserProgress progress;

  const GamificationDashboard({Key? key, required this.progress}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7F6), // Earthy light grey/green background
      appBar: AppBar(
        title: Text(context.watch<LanguageProvider>().translate('ecological_adventure'), style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.account_balance_wallet, color: Color(0xFF2E7D32)),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => WalletScreen(points: progress.totalPoints)));
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTierCard(context),
            const SizedBox(height: 24),
            _buildStreakCard(context),
            const SizedBox(height: 24),
            Text(
              context.watch<LanguageProvider>().translate('your_achievements'),
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF3E4A3D)),
            ),
            const SizedBox(height: 16),
            _buildBadgesGrid(context),
          ],
        ),
      ),
    );
  }

  Widget _buildTierCard(BuildContext context) {
    final tier = progress.currentTier;
    final nextTier = progress.nextTier;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(context.watch<LanguageProvider>().translate('current_rank'), style: TextStyle(color: Colors.grey.shade600, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(tier.name, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: tier.color)),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: tier.color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.military_tech, color: tier.color, size: 32),
              )
            ],
          ),
          const SizedBox(height: 20),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress.tierProgress,
              minHeight: 12,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(tier.color),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("${progress.totalPoints} ${context.watch<LanguageProvider>().translate('points')}", style: const TextStyle(fontWeight: FontWeight.bold)),
              if (nextTier != null)
                Text("${context.watch<LanguageProvider>().translate('next_rank')}: ${nextTier.name} (${nextTier.threshold} ${context.watch<LanguageProvider>().translate('points')})", style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStreakCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4CAF50), Color(0xFF2E7D32)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.local_fire_department, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(context.watch<LanguageProvider>().translate('weekly_streak'), style: const TextStyle(color: Colors.white70, fontSize: 14)),
                Text("${progress.currentStreakDays} ${context.watch<LanguageProvider>().translate('days')}", style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          if (progress.currentStreakDays > 0)
            Text(context.watch<LanguageProvider>().translate('on_fire'), style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildBadgesGrid(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.85,
      ),
      itemCount: BadgeType.values.length,
      itemBuilder: (context, index) {
        final badge = BadgeType.values[index];
        final isEarned = progress.earnedBadges.contains(badge);

        return GestureDetector(
          onTap: isEarned ? () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => ShareableBadgeCard(badge: badge, userTier: progress.currentTier)));
          } : null,
          child: Container(
            decoration: BoxDecoration(
              color: isEarned ? Colors.white : Colors.grey.shade200,
              borderRadius: BorderRadius.circular(16),
              border: isEarned ? Border.all(color: const Color(0xFF81C784), width: 2) : null,
              boxShadow: isEarned ? [
                BoxShadow(
                  color: Colors.green.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                )
              ] : null,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  badge.icon,
                  size: 48,
                  color: isEarned ? const Color(0xFF388E3C) : Colors.grey.shade400,
                ),
                const SizedBox(height: 12),
                Text(
                  badge.title,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isEarned ? Colors.black87 : Colors.grey.shade500,
                  ),
                ),
                const SizedBox(height: 4),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  child: Text(
                    badge.description,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10,
                      color: isEarned ? Colors.grey.shade700 : Colors.grey.shade500,
                    ),
                  ),
                ),
                if (!isEarned)
                  const Padding(
                    padding: EdgeInsets.only(top: 8.0),
                    child: Icon(Icons.lock, size: 16, color: Colors.grey),
                  )
              ],
            ),
          ),
        );
      },
    );
  }
}
