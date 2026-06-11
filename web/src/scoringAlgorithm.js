/**
 * Advanced Scoring Algorithm for Temiz Dünya Platform
 * 
 * Scoring Formula:
 * Total Score = (Weight × 0.30) + (Difficulty × 0.20) + (Urgency × 0.15) + 
 *               (Team Efficiency × 0.20) + (Verification Bonus × 0.10) + (Time Factor × 0.05)
 * 
 * Each factor is normalized to 0-100 scale
 */

export class AdvancedScoringAlgorithm {
  /**
   * Base weight: 0-10 scale (area/effort)
   * Maps to 0-100 score
   */
  static scoreByWeight(weight) {
    if (weight < 0) return 0
    return Math.min(weight * 10, 100)
  }

  /**
   * Difficulty level: 1-5 scale
   * 1 = easy (20 points), 5 = very hard (100 points)
   */
  static scoreByDifficulty(difficulty) {
    if (difficulty < 1 || difficulty > 5) return 0
    return (difficulty - 1) * 20 + 20
  }

  /**
   * Urgency factor: 1-5 scale
   * 1 = not urgent (20 points), 5 = critical (100 points)
   */
  static scoreByUrgency(urgency) {
    if (urgency < 1 || urgency > 5) return 0
    return (urgency - 1) * 20 + 20
  }

  /**
   * Team efficiency: completion time vs estimated time
   * Faster than estimated = bonus (up to 100)
   * Takes 2x estimated time = 50 points
   */
  static scoreByTeamEfficiency(membersCount, completionPercentage) {
    if (membersCount < 1 || completionPercentage < 0) return 0
    
    // More members and higher completion = better efficiency
    const memberBonus = Math.min(membersCount * 10, 40)
    const completionBonus = Math.min(completionPercentage, 60)
    
    return Math.min(memberBonus + completionBonus, 100)
  }

  /**
   * Verification bonus: whether photo was verified
   * true = 100 points, false = 0 points
   */
  static scoreByVerificationBonus(isVerified) {
    return isVerified ? 100 : 0
  }

  /**
   * Time factor: hours spent on cleanup
   * 0-1 hour = 20 points
   * 1-2 hours = 50 points
   * 2-4 hours = 80 points
   * 4+ hours = 100 points
   */
  static scoreByTimeFactor(hoursSpent) {
    if (hoursSpent < 0) return 0
    if (hoursSpent < 1) return 20
    if (hoursSpent < 2) return 50
    if (hoursSpent < 4) return 80
    return 100
  }

  /**
   * Calculate score for waste types deposited (in Kg)
   * Plastic: x1.5, Glass: x1.2, Paper: x1.0, Metal: x1.8, Organic: x1.3
   */
  static calculateWasteScore({
    plastic = 0,
    glass = 0,
    paper = 0,
    metal = 0,
    organic = 0,
  }) {
    return (plastic * 1.5) + (glass * 1.2) + (paper * 1.0) + (metal * 1.8) + (organic * 1.3);
  }

  /**
   * Calculate total score using weighted formula
   * Returns final score (0-100)
   */
  static calculateTotalScore({
    weight,
    difficulty,
    urgency,
    membersCount,
    completionPercentage,
    isVerified,
    hoursSpent,
    plastic = 0,
    glass = 0,
    paper = 0,
    metal = 0,
    organic = 0,
    isAutonomousDevice = false,
  }) {
    // Validate inputs
    if (
      weight < 0 ||
      difficulty < 1 ||
      urgency < 1 ||
      membersCount < 1 ||
      completionPercentage < 0 ||
      hoursSpent < 0
    ) {
      throw new Error('Invalid scoring inputs')
    }

    // Calculate individual scores
    const weightScore = this.scoreByWeight(weight)
    const difficultyScore = this.scoreByDifficulty(difficulty)
    const urgencyScore = this.scoreByUrgency(urgency)
    const efficiencyScore = this.scoreByTeamEfficiency(membersCount, completionPercentage)
    const verificationScore = this.scoreByVerificationBonus(isVerified)
    const timeScore = this.scoreByTimeFactor(hoursSpent)

    // Calculate waste composition score
    const wastePoints = this.calculateWasteScore({
      plastic,
      glass,
      paper,
      metal,
      organic,
    })
    // If no specific waste breakdown is provided, fall back to weightScore
    const wasteCompositionScore = (wastePoints === 0.0 && weight > 0.0) 
        ? weightScore 
        : Math.min(wastePoints, 100)

    // Apply weights (percentages sum to 100%)
    // Weight_Score (20%) + Waste_Composition_Score (25%) + Difficulty_Score (15%) + 
    // Urgency_Score (10%) + Team_Efficiency_Score (15%) + Verification_Bonus (10%) + Time_Score (5%)
    let totalScore =
      weightScore * 0.20 +
      wasteCompositionScore * 0.25 +
      difficultyScore * 0.15 +
      urgencyScore * 0.10 +
      efficiencyScore * 0.15 +
      verificationScore * 0.10 +
      timeScore * 0.05

    if (isAutonomousDevice) {
      totalScore *= 1.10 // +10% bonus for using smart devices
    }

    return Math.min(Math.max(totalScore, 0), 100)
  }

  /**
   * Calculate score with multipliers for special cases
   * Used for achievements, milestones, etc.
   */
  static calculateWithMultiplier({ baseScore, multiplier, cap100 = true }) {
    const result = baseScore * multiplier
    return cap100 ? Math.min(Math.max(result, 0), 100) : result
  }

  /**
   * Determine badge based on accumulated points
   */
  static determineBadge(totalPoints) {
    if (totalPoints >= 2000) return 'platinum'
    if (totalPoints >= 1000) return 'gold'
    if (totalPoints >= 500) return 'silver'
    return 'bronze'
  }

  /**
   * Determine achievement level
   */
  static determineLevel(totalPoints) {
    if (totalPoints >= 5000) return 'master'
    if (totalPoints >= 2000) return 'expert'
    if (totalPoints >= 1000) return 'pro'
    if (totalPoints >= 500) return 'intermediate'
    if (totalPoints >= 100) return 'beginner'
    return 'novice'
  }

  /**
   * Get achievement description
   */
  static getAchievementDescription(achievement) {
    const descriptions = {
      first_cleanup: 'İlk temizlik görevini tamamladı',
      ten_cleanups: '10 temizlik görevini tamamladı',
      fifty_cleanups: '50 temizlik görevini tamamladı',
      hundred_cleanups: '100 temizlik görevini tamamladı',
      team_leader: 'Bir takıma liderlik etti',
      photo_verified: '10 fotoğrafı doğrulandı',
      efficiency_master: 'Takım verimliliğinde %90+ başarı',
      consistency_week: 'Bir hafta boyunca her gün katıldı',
      consistency_month: 'Bir ay boyunca her gün katıldı',
      high_difficulty: '5/5 zorluk seviyesinde temizlik yaptı',
    }
    return descriptions[achievement] || 'Bilinmeyen başarı'
  }

  /**
   * Check for achievements based on user stats
   */
  static checkAchievements({
    totalCleanups,
    verifiedPhotos,
    averageEfficiency,
    consecutiveDays,
    maxDifficulty,
  }) {
    const achievements = []

    if (totalCleanups === 1) achievements.push('first_cleanup')
    if (totalCleanups === 10) achievements.push('ten_cleanups')
    if (totalCleanups === 50) achievements.push('fifty_cleanups')
    if (totalCleanups === 100) achievements.push('hundred_cleanups')
    if (verifiedPhotos >= 10) achievements.push('photo_verified')
    if (averageEfficiency >= 90) achievements.push('efficiency_master')
    if (consecutiveDays >= 7) achievements.push('consistency_week')
    if (consecutiveDays >= 30) achievements.push('consistency_month')
    if (maxDifficulty === 5) achievements.push('high_difficulty')

    return achievements
  }

  /**
   * Calculate leaderboard position bonus
   * Top 10 = 20 points, Top 50 = 10 points, Top 100 = 5 points
   */
  static getLeaderboardBonus(position) {
    if (position <= 10) return 20
    if (position <= 50) return 10
    if (position <= 100) return 5
    return 0
  }

  /**
   * Calculate streak bonus
   * Each consecutive day adds 2 points (max 100)
   */
  static getStreakBonus(consecutiveDays) {
    return Math.min(consecutiveDays * 2, 100)
  }

  /**
   * Calculate team bonus (based on team size)
   * Larger teams = better bonus
   * 2-3 members = 10%, 4-5 members = 20%, 6+ members = 30%
   */
  static getTeamBonus(teamSize) {
    if (teamSize <= 1) return 0
    if (teamSize <= 3) return 1.1
    if (teamSize <= 5) return 1.2
    return 1.3
  }

  /**
   * Calculate final score with all bonuses
   */
  static calculateFinalScore({
    baseScore,
    leaderboardPosition,
    consecutiveDays,
    teamSize,
    isAutonomousDevice = false,
  }) {
    const leaderboardBonus = this.getLeaderboardBonus(leaderboardPosition)
    const streakBonus = this.getStreakBonus(consecutiveDays)
    const teamMultiplier = this.getTeamBonus(teamSize)

    let scoreWithMultiplier = baseScore * teamMultiplier
    if (isAutonomousDevice) {
      scoreWithMultiplier *= 1.10
    }
    const finalScore = scoreWithMultiplier + leaderboardBonus + streakBonus

    return Math.min(finalScore, 200) // Allow up to 200 with bonuses
  }

  /**
   * Get score breakdown for UI display
   */
  static getScoreBreakdown({
    weight,
    difficulty,
    urgency,
    membersCount,
    completionPercentage,
    isVerified,
    hoursSpent,
    plastic = 0,
    glass = 0,
    paper = 0,
    metal = 0,
    organic = 0,
    isAutonomousDevice = false,
  }) {
    const weightScore = this.scoreByWeight(weight)
    const wastePoints = this.calculateWasteScore({
      plastic,
      glass,
      paper,
      metal,
      organic,
    })
    const wasteCompositionScore = (wastePoints === 0.0 && weight > 0.0) 
        ? weightScore 
        : Math.min(wastePoints, 100)

    return {
      weight: weightScore,
      wasteComposition: wasteCompositionScore,
      difficulty: this.scoreByDifficulty(difficulty),
      urgency: this.scoreByUrgency(urgency),
      efficiency: this.scoreByTeamEfficiency(membersCount, completionPercentage),
      verification: this.scoreByVerificationBonus(isVerified),
      time: this.scoreByTimeFactor(hoursSpent),
      total: this.calculateTotalScore({
        weight,
        difficulty,
        urgency,
        membersCount,
        completionPercentage,
        isVerified,
        hoursSpent,
        plastic,
        glass,
        paper,
        metal,
        organic,
        isAutonomousDevice,
      }),
    }
  }
}

/**
 * Score factors configuration
 */
export const ScoreFactors = {
  WEIGHT: 0.3,
  DIFFICULTY: 0.2,
  URGENCY: 0.15,
  EFFICIENCY: 0.2,
  VERIFICATION: 0.1,
  TIME: 0.05,
}

/**
 * Cleanup difficulty levels
 */
export const CleanupDifficulty = {
  EASY: { value: 1, label: '😊 Kolay', score: 20 },
  MEDIUM: { value: 2, label: '😐 Orta', score: 40 },
  HARD: { value: 3, label: '😤 Zor', score: 60 },
  VERY_HARD: { value: 4, label: '😫 Çok Zor', score: 80 },
  EXTREME: { value: 5, label: '🤯 Çok Ekstrem', score: 100 },
}

/**
 * Cleanup urgency levels
 */
export const CleanupUrgency = {
  LOW: { value: 1, label: '😎 Düşük', score: 20 },
  MEDIUM: { value: 2, label: '😐 Orta', score: 40 },
  HIGH: { value: 3, label: '⚠️ Yüksek', score: 60 },
  VERY_HIGH: { value: 4, label: '🚨 Çok Yüksek', score: 80 },
  CRITICAL: { value: 5, label: '🆘 Kritik', score: 100 },
}

/**
 * Achievement definitions
 */
export const Achievements = {
  FIRST_CLEANUP: 'first_cleanup',
  TEN_CLEANUPS: 'ten_cleanups',
  FIFTY_CLEANUPS: 'fifty_cleanups',
  HUNDRED_CLEANUPS: 'hundred_cleanups',
  TEAM_LEADER: 'team_leader',
  PHOTO_VERIFIED: 'photo_verified',
  EFFICIENCY_MASTER: 'efficiency_master',
  CONSISTENCY_WEEK: 'consistency_week',
  CONSISTENCY_MONTH: 'consistency_month',
  HIGH_DIFFICULTY: 'high_difficulty',
}

/**
 * Scoring utility functions
 */
export const ScoringUtils = {
  /**
   * Convert hours to scoring hours (with caps)
   */
  normalizeHours: (minutes) => {
    return Math.min(minutes / 60, 8) // Cap at 8 hours
  },

  /**
   * Convert percentage to 0-100 scale
   */
  normalizePercentage: (value, max = 100) => {
    return Math.min((value / max) * 100, 100)
  },

  /**
   * Get emoji for difficulty
   */
  getDifficultyEmoji: (difficulty) => {
    const emojis = {
      1: '😊',
      2: '😐',
      3: '😤',
      4: '😫',
      5: '🤯',
    }
    return emojis[difficulty] || '❓'
  },

  /**
   * Get emoji for urgency
   */
  getUrgencyEmoji: (urgency) => {
    const emojis = {
      1: '😎',
      2: '😐',
      3: '⚠️',
      4: '🚨',
      5: '🆘',
    }
    return emojis[urgency] || '❓'
  },

  /**
   * Format score display
   */
  formatScore: (score) => {
    return Math.round(score).toLocaleString('tr-TR')
  },

  /**
   * Get score level color
   */
  getScoreColor: (score) => {
    if (score >= 80) return '#2ecc71' // Green
    if (score >= 60) return '#3498db' // Blue
    if (score >= 40) return '#f39c12' // Orange
    return '#e74c3c' // Red
  },
}
