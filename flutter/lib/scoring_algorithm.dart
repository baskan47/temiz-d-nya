/// Advanced Scoring Algorithm for Temiz Dünya Platform
/// 
/// Scoring Formula:
/// Total Score = (Weight × 0.30) + (Difficulty × 0.20) + (Urgency × 0.15) + 
///               (Team Efficiency × 0.20) + (Verification Bonus × 0.10) + (Time Factor × 0.05)
/// 
/// Each factor is normalized to 0-100 scale

class AdvancedScoringAlgorithm {
  /// Base weight: 0-10 scale (area/effort)
  /// Maps to 0-100 score
  static double scoreByWeight(double weight) {
    if (weight < 0) return 0;
    return (weight * 10).clamp(0.0, 100.0).toDouble();
  }

  /// Difficulty level: 1-5 scale
  /// 1 = easy (20 points), 5 = very hard (100 points)
  static double scoreByDifficulty(int difficulty) {
    if (difficulty < 1 || difficulty > 5) return 0;
    return ((difficulty - 1) * 20 + 20).toDouble();
  }

  /// Urgency factor: 1-5 scale
  /// 1 = not urgent (20 points), 5 = critical (100 points)
  static double scoreByUrgency(int urgency) {
    if (urgency < 1 || urgency > 5) return 0;
    return ((urgency - 1) * 20 + 20).toDouble();
  }

  /// Team efficiency: completion time vs estimated time
  /// ratio: actualTime / estimatedTime
  /// Faster than estimated = bonus (up to 100)
  /// Takes 2x estimated time = 50 points
  static double scoreByTeamEfficiency(int membersCount, double completionPercentage) {
    if (membersCount < 1 || completionPercentage < 0) return 0;
    
    // More members and higher completion = better efficiency
    final memberBonus = (membersCount * 10).toDouble().clamp(0, 40).toDouble();
    final completionBonus = (completionPercentage).toDouble().clamp(0, 60).toDouble();
    
    return (memberBonus + completionBonus).clamp(0, 100).toDouble();
  }

  /// Verification bonus: whether photo was verified
  /// true = 100 points, false = 0 points
  static double scoreByVerificationBonus(bool isVerified) {
    return isVerified ? 100.0 : 0.0;
  }

  /// Time factor: hours spent on cleanup
  /// 0-1 hour = 20 points
  /// 1-2 hours = 50 points
  /// 2-4 hours = 80 points
  /// 4+ hours = 100 points
  static double scoreByTimeFactor(double hoursSpent) {
    if (hoursSpent < 0) return 0;
    if (hoursSpent < 1) return 20;
    if (hoursSpent < 2) return 50;
    if (hoursSpent < 4) return 80;
    return 100;
  }

  /// Calculate score for waste types deposited (in Kg)
  /// Plastic: x1.5, Glass: x1.2, Paper: x1.0, Metal: x1.8, Organic: x1.3
  static double calculateWasteScore({
    double plastic = 0,
    double glass = 0,
    double paper = 0,
    double metal = 0,
    double organic = 0,
  }) {
    return (plastic * 1.5) + (glass * 1.2) + (paper * 1.0) + (metal * 1.8) + (organic * 1.3);
  }

  /// Calculate total score using weighted formula
  /// Returns final score (0-100)
  static double calculateTotalScore({
    required double weight,
    required int difficulty,
    required int urgency,
    required int membersCount,
    required double completionPercentage,
    required bool isVerified,
    required double hoursSpent,
    double plastic = 0,
    double glass = 0,
    double paper = 0,
    double metal = 0,
    double organic = 0,
    bool isAutonomousDevice = false,
  }) {
    // Validate inputs
    if (weight < 0 || difficulty < 1 || urgency < 1 || membersCount < 1 || 
        completionPercentage < 0 || hoursSpent < 0) {
      throw ArgumentError('Invalid scoring inputs');
    }

    // Calculate individual scores
    final weightScore = scoreByWeight(weight);
    final difficultyScore = scoreByDifficulty(difficulty);
    final urgencyScore = scoreByUrgency(urgency);
    final efficiencyScore = scoreByTeamEfficiency(membersCount, completionPercentage);
    final verificationScore = scoreByVerificationBonus(isVerified);
    final timeScore = scoreByTimeFactor(hoursSpent);

    // Calculate waste composition score
    final wastePoints = calculateWasteScore(
      plastic: plastic,
      glass: glass,
      paper: paper,
      metal: metal,
      organic: organic,
    );
    // If no specific waste breakdown is provided, fall back to weightScore
    final wasteCompositionScore = (wastePoints == 0.0 && weight > 0.0) 
        ? weightScore 
        : wastePoints.clamp(0.0, 100.0);

    // Apply weights (percentages sum to 100%)
    // Weight_Score (20%) + Waste_Composition_Score (25%) + Difficulty_Score (15%) + 
    // Urgency_Score (10%) + Team_Efficiency_Score (15%) + Verification_Bonus (10%) + Time_Score (5%)
    double totalScore = (
      (weightScore * 0.20) +
      (wasteCompositionScore * 0.25) +
      (difficultyScore * 0.15) +
      (urgencyScore * 0.10) +
      (efficiencyScore * 0.15) +
      (verificationScore * 0.10) +
      (timeScore * 0.05)
    );

    if (isAutonomousDevice) {
      totalScore *= 1.10; // +10% bonus for using smart devices
    }

    return totalScore.clamp(0, 100).toDouble();
  }

  /// Calculate score with multipliers for special cases
  /// Used for achievements, milestones, etc.
  static double calculateWithMultiplier({
    required double baseScore,
    required double multiplier,
    bool cap100 = true,
  }) {
    final result = baseScore * multiplier;
    return cap100 ? result.clamp(0, 100).toDouble() : result;
  }

  /// Determine badge based on accumulated points
  static String determineBadge(double totalPoints) {
    if (totalPoints >= 2000) return 'platinum';
    if (totalPoints >= 1000) return 'gold';
    if (totalPoints >= 500) return 'silver';
    return 'bronze';
  }

  /// Determine achievement level
  static String determineLevel(double totalPoints) {
    if (totalPoints >= 5000) return 'master';
    if (totalPoints >= 2000) return 'expert';
    if (totalPoints >= 1000) return 'pro';
    if (totalPoints >= 500) return 'intermediate';
    if (totalPoints >= 100) return 'beginner';
    return 'novice';
  }

  /// Get achievement description
  static String getAchievementDescription(String achievement) {
    const descriptions = {
      'first_cleanup': 'İlk temizlik görevini tamamladı',
      'ten_cleanups': '10 temizlik görevini tamamladı',
      'fifty_cleanups': '50 temizlik görevini tamamladı',
      'hundred_cleanups': '100 temizlik görevini tamamladı',
      'team_leader': 'Bir takıma liderlik etti',
      'photo_verified': '10 fotoğrafı doğrulandı',
      'efficiency_master': 'Takım verimliliğinde %90+ başarı',
      'consistency_week': 'Bir hafta boyunca her gün katıldı',
      'consistency_month': 'Bir ay boyunca her gün katıldı',
      'high_difficulty': '5/5 zorluk seviyesinde temizlik yaptı',
    };
    return descriptions[achievement] ?? 'Bilinmeyen başarı';
  }

  /// Check for achievements based on user stats
  static List<String> checkAchievements({
    required int totalCleanups,
    required int verifiedPhotos,
    required double averageEfficiency,
    required int consecutiveDays,
    required int maxDifficulty,
  }) {
    final achievements = <String>[];

    if (totalCleanups == 1) achievements.add('first_cleanup');
    if (totalCleanups == 10) achievements.add('ten_cleanups');
    if (totalCleanups == 50) achievements.add('fifty_cleanups');
    if (totalCleanups == 100) achievements.add('hundred_cleanups');
    if (verifiedPhotos >= 10) achievements.add('photo_verified');
    if (averageEfficiency >= 90) achievements.add('efficiency_master');
    if (consecutiveDays >= 7) achievements.add('consistency_week');
    if (consecutiveDays >= 30) achievements.add('consistency_month');
    if (maxDifficulty == 5) achievements.add('high_difficulty');

    return achievements;
  }

  /// Calculate leaderboard position bonus
  /// Top 10 = 20 points, Top 50 = 10 points, Top 100 = 5 points
  static double getLeaderboardBonus(int position) {
    if (position <= 10) return 20;
    if (position <= 50) return 10;
    if (position <= 100) return 5;
    return 0;
  }

  /// Calculate streak bonus
  /// Each consecutive day adds 2 points (max 100)
  static double getStreakBonus(int consecutiveDays) {
    return ((consecutiveDays * 2).toDouble()).clamp(0, 100).toDouble();
  }

  /// Calculate team bonus (based on team size)
  /// Larger teams = better bonus
  /// 2-3 members = 10%, 4-5 members = 20%, 6+ members = 30%
  static double getTeamBonus(int teamSize) {
    if (teamSize <= 1) return 0;
    if (teamSize <= 3) return 1.10;
    if (teamSize <= 5) return 1.20;
    return 1.30;
  }

  /// Calculate final score with all bonuses
  static double calculateFinalScore({
    required double baseScore,
    required int leaderboardPosition,
    required int consecutiveDays,
    required int teamSize,
    bool isAutonomousDevice = false,
  }) {
    final leaderboardBonus = getLeaderboardBonus(leaderboardPosition);
    final streakBonus = getStreakBonus(consecutiveDays);
    final teamMultiplier = getTeamBonus(teamSize);

    double scoreWithMultiplier = baseScore * teamMultiplier;
    if (isAutonomousDevice) {
      scoreWithMultiplier *= 1.10;
    }
    final finalScore = scoreWithMultiplier + leaderboardBonus + streakBonus;

    return finalScore.clamp(0, 200).toDouble(); // Allow up to 200 with bonuses
  }

  /// Get score breakdown for UI display
  static Map<String, double> getScoreBreakdown({
    required double weight,
    required int difficulty,
    required int urgency,
    required int membersCount,
    required double completionPercentage,
    required bool isVerified,
    required double hoursSpent,
    double plastic = 0,
    double glass = 0,
    double paper = 0,
    double metal = 0,
    double organic = 0,
    bool isAutonomousDevice = false,
  }) {
    final weightScore = scoreByWeight(weight);
    final wastePoints = calculateWasteScore(
      plastic: plastic,
      glass: glass,
      paper: paper,
      metal: metal,
      organic: organic,
    );
    final wasteCompositionScore = (wastePoints == 0.0 && weight > 0.0) 
        ? weightScore 
        : wastePoints.clamp(0.0, 100.0);

    return {
      'weight': weightScore,
      'wasteComposition': wasteCompositionScore,
      'difficulty': scoreByDifficulty(difficulty),
      'urgency': scoreByUrgency(urgency),
      'efficiency': scoreByTeamEfficiency(membersCount, completionPercentage),
      'verification': scoreByVerificationBonus(isVerified),
      'time': scoreByTimeFactor(hoursSpent),
      'total': calculateTotalScore(
        weight: weight,
        difficulty: difficulty,
        urgency: urgency,
        membersCount: membersCount,
        completionPercentage: completionPercentage,
        isVerified: isVerified,
        hoursSpent: hoursSpent,
        plastic: plastic,
        glass: glass,
        paper: paper,
        metal: metal,
        organic: organic,
        isAutonomousDevice: isAutonomousDevice,
      ),
    };
  }
}

/// Score factors enum for clarity
enum ScoreFactor {
  weight(0.30),
  difficulty(0.20),
  urgency(0.15),
  efficiency(0.20),
  verification(0.10),
  time(0.05);

  final double value;
  const ScoreFactor(this.value);
}

/// Cleanup difficulty levels
enum CleanupDifficulty {
  easy(1, '😊 Kolay'),
  medium(2, '😐 Orta'),
  hard(3, '😤 Zor'),
  veryHard(4, '😫 Çok Zor'),
  extreme(5, '🤯 Çok Ekstrem');

  final int value;
  final String label;
  const CleanupDifficulty(this.value, this.label);
}

/// Cleanup urgency levels
enum CleanupUrgency {
  low(1, '😎 Düşük'),
  medium(2, '😐 Orta'),
  high(3, '⚠️ Yüksek'),
  veryHigh(4, '🚨 Çok Yüksek'),
  critical(5, '🆘 Kritik');

  final int value;
  final String label;
  const CleanupUrgency(this.value, this.label);
}
