import 'package:flutter/material.dart';

enum Tier {
  caylak("Çaylak", 0, Colors.grey),
  dogaDostu("Doğa Dostu", 500, Colors.green),
  ekoSavasci("Eko-Savaşçı", 1500, Colors.teal),
  bolgeMuhafizi("Bölge Muhafızı", 3000, Colors.blueAccent);

  final String name;
  final int threshold;
  final Color color;

  const Tier(this.name, this.threshold, this.color);
}

enum BadgeType {
  ilkTemizlik("İlk Temizlik", "İlk bölgeni temizledin!", Icons.eco),
  geceKusu("Gece Kuşu", "Gece 00:00 ile 06:00 arası temizlik yaptın.", Icons.nightlight_round),
  haftalikSeri("Haftalık Seri", "7 gün üst üste aktif oldun.", Icons.local_fire_department),
  sosyalKelebek("Sosyal Kelebek", "İlk temizlik etkinliğini paylaştın.", Icons.share);

  final String title;
  final String description;
  final IconData icon;

  const BadgeType(this.title, this.description, this.icon);
}

class UserProgress {
  final int totalPoints;
  final int currentStreakDays;
  final DateTime? lastActionDate;
  final List<BadgeType> earnedBadges;

  UserProgress({
    required this.totalPoints,
    required this.currentStreakDays,
    this.lastActionDate,
    required this.earnedBadges,
  });

  Tier get currentTier {
    if (totalPoints >= Tier.bolgeMuhafizi.threshold) return Tier.bolgeMuhafizi;
    if (totalPoints >= Tier.ekoSavasci.threshold) return Tier.ekoSavasci;
    if (totalPoints >= Tier.dogaDostu.threshold) return Tier.dogaDostu;
    return Tier.caylak;
  }

  Tier? get nextTier {
    if (totalPoints < Tier.dogaDostu.threshold) return Tier.dogaDostu;
    if (totalPoints < Tier.ekoSavasci.threshold) return Tier.ekoSavasci;
    if (totalPoints < Tier.bolgeMuhafizi.threshold) return Tier.bolgeMuhafizi;
    return null;
  }

  double get tierProgress {
    final next = nextTier;
    if (next == null) return 1.0;
    
    final current = currentTier;
    final range = next.threshold - current.threshold;
    final progress = totalPoints - current.threshold;
    
    return (progress / range).clamp(0.0, 1.0);
  }
}

class GamificationEngine {
  // Puanlama mantığı
  static const int pointsForReporting = 10;
  static const int pointsForCleaning = 50;

  static UserProgress processAction({
    required UserProgress currentProgress,
    required String actionType, // 'report' or 'clean'
    required DateTime actionTime,
  }) {
    int pointsEarned = actionType == 'clean' ? pointsForCleaning : pointsForReporting;
    int newPoints = currentProgress.totalPoints + pointsEarned;
    
    // Seri (Streak) Mantığı
    int newStreak = currentProgress.currentStreakDays;
    if (currentProgress.lastActionDate != null) {
      final diff = actionTime.difference(currentProgress.lastActionDate!).inDays;
      if (diff == 1) {
        newStreak += 1;
      } else if (diff > 1) {
        newStreak = 1; // Seri kırıldı
      }
      // Aynı gün ise seri artmaz
    } else {
      newStreak = 1; // İlk eylem
    }

    // Rozet Kontrolü
    List<BadgeType> newBadges = List.from(currentProgress.earnedBadges);
    
    if (actionType == 'clean' && !newBadges.contains(BadgeType.ilkTemizlik)) {
      newBadges.add(BadgeType.ilkTemizlik);
    }
    
    if (actionTime.hour >= 0 && actionTime.hour <= 6 && !newBadges.contains(BadgeType.geceKusu)) {
      newBadges.add(BadgeType.geceKusu);
    }
    
    if (newStreak >= 7 && !newBadges.contains(BadgeType.haftalikSeri)) {
      newBadges.add(BadgeType.haftalikSeri);
    }

    return UserProgress(
      totalPoints: newPoints,
      currentStreakDays: newStreak,
      lastActionDate: actionTime,
      earnedBadges: newBadges,
    );
  }

  static String checkStreakWarning(UserProgress progress, DateTime currentTime) {
    if (progress.lastActionDate == null || progress.currentStreakDays == 0) return "";
    
    final hoursSinceLastAction = currentTime.difference(progress.lastActionDate!).inHours;
    if (hoursSinceLastAction >= 24 && hoursSinceLastAction < 48) {
      return "Doğa seni özledi! Serini kaybetmemek için bugün bir bildirim veya temizlik yap.";
    } else if (hoursSinceLastAction >= 48) {
      return "Serin bozuldu ama tekrar başlamak için harika bir gün!";
    }
    return "";
  }
}
