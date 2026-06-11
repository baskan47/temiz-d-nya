import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  AdvancedScoringAlgorithm,
  ScoreFactors,
  CleanupDifficulty,
  CleanupUrgency,
  Achievements,
  ScoringUtils,
} from '../scoringAlgorithm'

describe('Advanced Scoring Algorithm - Web', () => {
  describe('Score by Weight', () => {
    it('should return 0 for weight 0', () => {
      expect(AdvancedScoringAlgorithm.scoreByWeight(0)).toBe(0)
    })

    it('should return 10 for weight 1', () => {
      expect(AdvancedScoringAlgorithm.scoreByWeight(1)).toBe(10)
    })

    it('should return 50 for weight 5', () => {
      expect(AdvancedScoringAlgorithm.scoreByWeight(5)).toBe(50)
    })

    it('should return 100 for weight 10', () => {
      expect(AdvancedScoringAlgorithm.scoreByWeight(10)).toBe(100)
    })

    it('should cap at 100 for weight > 10', () => {
      expect(AdvancedScoringAlgorithm.scoreByWeight(15)).toBe(100)
    })

    it('should return 0 for negative weight', () => {
      expect(AdvancedScoringAlgorithm.scoreByWeight(-5)).toBe(0)
    })
  })

  describe('Score by Difficulty', () => {
    it('should return 20 for difficulty 1', () => {
      expect(AdvancedScoringAlgorithm.scoreByDifficulty(1)).toBe(20)
    })

    it('should return 40 for difficulty 2', () => {
      expect(AdvancedScoringAlgorithm.scoreByDifficulty(2)).toBe(40)
    })

    it('should return 60 for difficulty 3', () => {
      expect(AdvancedScoringAlgorithm.scoreByDifficulty(3)).toBe(60)
    })

    it('should return 80 for difficulty 4', () => {
      expect(AdvancedScoringAlgorithm.scoreByDifficulty(4)).toBe(80)
    })

    it('should return 100 for difficulty 5', () => {
      expect(AdvancedScoringAlgorithm.scoreByDifficulty(5)).toBe(100)
    })

    it('should return 0 for invalid difficulty', () => {
      expect(AdvancedScoringAlgorithm.scoreByDifficulty(0)).toBe(0)
      expect(AdvancedScoringAlgorithm.scoreByDifficulty(6)).toBe(0)
    })
  })

  describe('Score by Urgency', () => {
    it('should return 20 for urgency 1', () => {
      expect(AdvancedScoringAlgorithm.scoreByUrgency(1)).toBe(20)
    })

    it('should return 100 for urgency 5', () => {
      expect(AdvancedScoringAlgorithm.scoreByUrgency(5)).toBe(100)
    })

    it('should return 0 for invalid urgency', () => {
      expect(AdvancedScoringAlgorithm.scoreByUrgency(0)).toBe(0)
      expect(AdvancedScoringAlgorithm.scoreByUrgency(6)).toBe(0)
    })
  })

  describe('Score by Team Efficiency', () => {
    it('should return score for valid members and completion', () => {
      const score = AdvancedScoringAlgorithm.scoreByTeamEfficiency(3, 75)
      expect(score).toBeGreaterThan(50)
    })

    it('should cap at 100', () => {
      const score = AdvancedScoringAlgorithm.scoreByTeamEfficiency(10, 100)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should return 0 for invalid members', () => {
      expect(AdvancedScoringAlgorithm.scoreByTeamEfficiency(0, 50)).toBe(0)
    })

    it('should return 0 for negative completion', () => {
      expect(
        AdvancedScoringAlgorithm.scoreByTeamEfficiency(2, -10)
      ).toBe(0)
    })
  })

  describe('Score by Verification', () => {
    it('should return 100 for verified photo', () => {
      expect(AdvancedScoringAlgorithm.scoreByVerificationBonus(true)).toBe(100)
    })

    it('should return 0 for unverified photo', () => {
      expect(AdvancedScoringAlgorithm.scoreByVerificationBonus(false)).toBe(0)
    })
  })

  describe('Score by Time', () => {
    it('should return 20 for 0.5 hours', () => {
      expect(AdvancedScoringAlgorithm.scoreByTimeFactor(0.5)).toBe(20)
    })

    it('should return 50 for 1.5 hours', () => {
      expect(AdvancedScoringAlgorithm.scoreByTimeFactor(1.5)).toBe(50)
    })

    it('should return 80 for 3 hours', () => {
      expect(AdvancedScoringAlgorithm.scoreByTimeFactor(3)).toBe(80)
    })

    it('should return 100 for 5+ hours', () => {
      expect(AdvancedScoringAlgorithm.scoreByTimeFactor(5)).toBe(100)
    })

    it('should return 0 for negative hours', () => {
      expect(AdvancedScoringAlgorithm.scoreByTimeFactor(-1)).toBe(0)
    })
  })

  describe('Calculate Total Score', () => {
    it('should calculate minimum valid score', () => {
      const score = AdvancedScoringAlgorithm.calculateTotalScore({
        weight: 1,
        difficulty: 1,
        urgency: 1,
        membersCount: 1,
        completionPercentage: 10,
        isVerified: false,
        hoursSpent: 0.5,
      })
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should calculate maximum valid score', () => {
      const score = AdvancedScoringAlgorithm.calculateTotalScore({
        weight: 10,
        difficulty: 5,
        urgency: 5,
        membersCount: 10,
        completionPercentage: 100,
        isVerified: true,
        hoursSpent: 5,
      })
      expect(score).toBeGreaterThan(80)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should calculate medium score', () => {
      const score = AdvancedScoringAlgorithm.calculateTotalScore({
        weight: 5,
        difficulty: 3,
        urgency: 3,
        membersCount: 3,
        completionPercentage: 75,
        isVerified: true,
        hoursSpent: 2,
      })
      expect(score).toBeGreaterThan(40)
      expect(score).toBeLessThan(100)
    })

    it('should throw error for invalid inputs', () => {
      expect(() =>
        AdvancedScoringAlgorithm.calculateTotalScore({
          weight: -1,
          difficulty: 3,
          urgency: 3,
          membersCount: 3,
          completionPercentage: 50,
          isVerified: false,
          hoursSpent: 2,
        })
      ).toThrow()
    })
  })

  describe('Calculate with Multiplier', () => {
    it('should increase score with multiplier', () => {
      const baseScore = 50
      const multiplied = AdvancedScoringAlgorithm.calculateWithMultiplier({
        baseScore,
        multiplier: 1.5,
      })
      expect(multiplied).toBeGreaterThan(baseScore)
    })

    it('should cap at 100 when cap100 is true', () => {
      const multiplied = AdvancedScoringAlgorithm.calculateWithMultiplier({
        baseScore: 80,
        multiplier: 2,
        cap100: true,
      })
      expect(multiplied).toBe(100)
    })

    it('should not cap when cap100 is false', () => {
      const multiplied = AdvancedScoringAlgorithm.calculateWithMultiplier({
        baseScore: 80,
        multiplier: 2,
        cap100: false,
      })
      expect(multiplied).toBe(160)
    })
  })

  describe('Determine Badge', () => {
    it('should return bronze for 0-499 points', () => {
      expect(AdvancedScoringAlgorithm.determineBadge(100)).toBe('bronze')
    })

    it('should return silver for 500-999 points', () => {
      expect(AdvancedScoringAlgorithm.determineBadge(750)).toBe('silver')
    })

    it('should return gold for 1000-1999 points', () => {
      expect(AdvancedScoringAlgorithm.determineBadge(1500)).toBe('gold')
    })

    it('should return platinum for 2000+ points', () => {
      expect(AdvancedScoringAlgorithm.determineBadge(2500)).toBe('platinum')
    })
  })

  describe('Determine Level', () => {
    it('should return novice for 0-99 points', () => {
      expect(AdvancedScoringAlgorithm.determineLevel(50)).toBe('novice')
    })

    it('should return beginner for 100-499 points', () => {
      expect(AdvancedScoringAlgorithm.determineLevel(300)).toBe('beginner')
    })

    it('should return intermediate for 500-999 points', () => {
      expect(AdvancedScoringAlgorithm.determineLevel(700)).toBe('intermediate')
    })

    it('should return pro for 1000-1999 points', () => {
      expect(AdvancedScoringAlgorithm.determineLevel(1500)).toBe('pro')
    })

    it('should return expert for 2000-4999 points', () => {
      expect(AdvancedScoringAlgorithm.determineLevel(3000)).toBe('expert')
    })

    it('should return master for 5000+ points', () => {
      expect(AdvancedScoringAlgorithm.determineLevel(6000)).toBe('master')
    })
  })

  describe('Check Achievements', () => {
    it('should return first_cleanup achievement', () => {
      const achievements = AdvancedScoringAlgorithm.checkAchievements({
        totalCleanups: 1,
        verifiedPhotos: 0,
        averageEfficiency: 0,
        consecutiveDays: 0,
        maxDifficulty: 1,
      })
      expect(achievements).toContain('first_cleanup')
    })

    it('should return ten_cleanups achievement', () => {
      const achievements = AdvancedScoringAlgorithm.checkAchievements({
        totalCleanups: 10,
        verifiedPhotos: 0,
        averageEfficiency: 0,
        consecutiveDays: 0,
        maxDifficulty: 1,
      })
      expect(achievements).toContain('ten_cleanups')
    })

    it('should return photo_verified achievement', () => {
      const achievements = AdvancedScoringAlgorithm.checkAchievements({
        totalCleanups: 0,
        verifiedPhotos: 10,
        averageEfficiency: 0,
        consecutiveDays: 0,
        maxDifficulty: 1,
      })
      expect(achievements).toContain('photo_verified')
    })

    it('should return consistency achievements', () => {
      const achievements = AdvancedScoringAlgorithm.checkAchievements({
        totalCleanups: 0,
        verifiedPhotos: 0,
        averageEfficiency: 0,
        consecutiveDays: 7,
        maxDifficulty: 1,
      })
      expect(achievements).toContain('consistency_week')
    })

    it('should return multiple achievements', () => {
      const achievements = AdvancedScoringAlgorithm.checkAchievements({
        totalCleanups: 50,
        verifiedPhotos: 10,
        averageEfficiency: 90,
        consecutiveDays: 30,
        maxDifficulty: 5,
      })
      expect(achievements.length).toBeGreaterThan(0)
    })
  })

  describe('Leaderboard Bonus', () => {
    it('should return 20 for top 10', () => {
      expect(AdvancedScoringAlgorithm.getLeaderboardBonus(5)).toBe(20)
    })

    it('should return 10 for top 50', () => {
      expect(AdvancedScoringAlgorithm.getLeaderboardBonus(25)).toBe(10)
    })

    it('should return 5 for top 100', () => {
      expect(AdvancedScoringAlgorithm.getLeaderboardBonus(75)).toBe(5)
    })

    it('should return 0 for beyond 100', () => {
      expect(AdvancedScoringAlgorithm.getLeaderboardBonus(150)).toBe(0)
    })
  })

  describe('Streak Bonus', () => {
    it('should return 2 for 1 day', () => {
      expect(AdvancedScoringAlgorithm.getStreakBonus(1)).toBe(2)
    })

    it('should return 14 for 7 days', () => {
      expect(AdvancedScoringAlgorithm.getStreakBonus(7)).toBe(14)
    })

    it('should cap at 100 for 50+ days', () => {
      expect(AdvancedScoringAlgorithm.getStreakBonus(50)).toBe(100)
    })
  })

  describe('Team Bonus', () => {
    it('should return 0 for solo (1 member)', () => {
      expect(AdvancedScoringAlgorithm.getTeamBonus(1)).toBe(0)
    })

    it('should return 1.1 for 2-3 members', () => {
      expect(AdvancedScoringAlgorithm.getTeamBonus(2)).toBe(1.1)
      expect(AdvancedScoringAlgorithm.getTeamBonus(3)).toBe(1.1)
    })

    it('should return 1.2 for 4-5 members', () => {
      expect(AdvancedScoringAlgorithm.getTeamBonus(4)).toBe(1.2)
      expect(AdvancedScoringAlgorithm.getTeamBonus(5)).toBe(1.2)
    })

    it('should return 1.3 for 6+ members', () => {
      expect(AdvancedScoringAlgorithm.getTeamBonus(6)).toBe(1.3)
      expect(AdvancedScoringAlgorithm.getTeamBonus(10)).toBe(1.3)
    })
  })

  describe('Calculate Final Score', () => {
    it('should calculate final score with bonuses', () => {
      const score = AdvancedScoringAlgorithm.calculateFinalScore({
        baseScore: 80,
        leaderboardPosition: 5,
        consecutiveDays: 7,
        teamSize: 4,
      })
      expect(score).toBeGreaterThan(80)
      expect(score).toBeLessThanOrEqual(200)
    })

    it('should apply team multiplier', () => {
      const scoreSmallTeam = AdvancedScoringAlgorithm.calculateFinalScore({
        baseScore: 80,
        leaderboardPosition: 50,
        consecutiveDays: 0,
        teamSize: 1,
      })
      const scoreLargeTeam = AdvancedScoringAlgorithm.calculateFinalScore({
        baseScore: 80,
        leaderboardPosition: 50,
        consecutiveDays: 0,
        teamSize: 8,
      })
      expect(scoreLargeTeam).toBeGreaterThan(scoreSmallTeam)
    })
  })

  describe('Get Score Breakdown', () => {
    it('should return all components', () => {
      const breakdown = AdvancedScoringAlgorithm.getScoreBreakdown({
        weight: 5,
        difficulty: 3,
        urgency: 3,
        membersCount: 3,
        completionPercentage: 75,
        isVerified: true,
        hoursSpent: 2,
      })

      expect(breakdown).toHaveProperty('weight')
      expect(breakdown).toHaveProperty('difficulty')
      expect(breakdown).toHaveProperty('urgency')
      expect(breakdown).toHaveProperty('efficiency')
      expect(breakdown).toHaveProperty('verification')
      expect(breakdown).toHaveProperty('time')
      expect(breakdown).toHaveProperty('total')
    })

    it('should have valid component values', () => {
      const breakdown = AdvancedScoringAlgorithm.getScoreBreakdown({
        weight: 5,
        difficulty: 3,
        urgency: 3,
        membersCount: 3,
        completionPercentage: 75,
        isVerified: true,
        hoursSpent: 2,
      })

      expect(breakdown.total).toBeGreaterThan(0)
      expect(breakdown.total).toBeLessThanOrEqual(100)
      expect(breakdown.weight).toBeGreaterThanOrEqual(0)
      expect(breakdown.difficulty).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Score Factors', () => {
    it('should have all factors', () => {
      expect(ScoreFactors.WEIGHT).toBe(0.3)
      expect(ScoreFactors.DIFFICULTY).toBe(0.2)
      expect(ScoreFactors.URGENCY).toBe(0.15)
      expect(ScoreFactors.EFFICIENCY).toBe(0.2)
      expect(ScoreFactors.VERIFICATION).toBe(0.1)
      expect(ScoreFactors.TIME).toBe(0.05)
    })

    it('should sum to 1', () => {
      const sum =
        ScoreFactors.WEIGHT +
        ScoreFactors.DIFFICULTY +
        ScoreFactors.URGENCY +
        ScoreFactors.EFFICIENCY +
        ScoreFactors.VERIFICATION +
        ScoreFactors.TIME
      expect(sum).toBeCloseTo(1, 2)
    })
  })

  describe('Cleanup Difficulty Enum', () => {
    it('should have all difficulty levels', () => {
      expect(CleanupDifficulty.EASY.value).toBe(1)
      expect(CleanupDifficulty.MEDIUM.value).toBe(2)
      expect(CleanupDifficulty.HARD.value).toBe(3)
      expect(CleanupDifficulty.VERY_HARD.value).toBe(4)
      expect(CleanupDifficulty.EXTREME.value).toBe(5)
    })

    it('should have labels', () => {
      expect(CleanupDifficulty.EASY.label).toContain('Kolay')
      expect(CleanupDifficulty.EXTREME.label).toContain('Ekstrem')
    })
  })

  describe('Cleanup Urgency Enum', () => {
    it('should have all urgency levels', () => {
      expect(CleanupUrgency.LOW.value).toBe(1)
      expect(CleanupUrgency.CRITICAL.value).toBe(5)
    })

    it('should have labels', () => {
      expect(CleanupUrgency.LOW.label).toContain('Düşük')
      expect(CleanupUrgency.CRITICAL.label).toContain('Kritik')
    })
  })

  describe('Scoring Utils', () => {
    it('should normalize hours', () => {
      expect(ScoringUtils.normalizeHours(60)).toBe(1)
      expect(ScoringUtils.normalizeHours(120)).toBe(2)
      expect(ScoringUtils.normalizeHours(600)).toBe(8) // Capped at 8
    })

    it('should normalize percentage', () => {
      expect(ScoringUtils.normalizePercentage(50)).toBe(50)
      expect(ScoringUtils.normalizePercentage(100)).toBe(100)
      expect(ScoringUtils.normalizePercentage(150)).toBe(100) // Capped at 100
    })

    it('should get difficulty emoji', () => {
      expect(ScoringUtils.getDifficultyEmoji(1)).toBe('😊')
      expect(ScoringUtils.getDifficultyEmoji(5)).toBe('🤯')
    })

    it('should get urgency emoji', () => {
      expect(ScoringUtils.getUrgencyEmoji(1)).toBe('😎')
      expect(ScoringUtils.getUrgencyEmoji(5)).toBe('🆘')
    })

    it('should format score', () => {
      const formatted = ScoringUtils.formatScore(1234.5)
      expect(typeof formatted).toBe('string')
    })

    it('should get score color', () => {
      expect(ScoringUtils.getScoreColor(90)).toBe('#2ecc71') // Green
      expect(ScoringUtils.getScoreColor(70)).toBe('#3498db') // Blue
      expect(ScoringUtils.getScoreColor(50)).toBe('#f39c12') // Orange
      expect(ScoringUtils.getScoreColor(30)).toBe('#e74c3c') // Red
    })
  })

  describe('Edge Cases', () => {
    it('should handle all zero inputs', () => {
      const score = AdvancedScoringAlgorithm.calculateTotalScore({
        weight: 1,
        difficulty: 1,
        urgency: 1,
        membersCount: 1,
        completionPercentage: 0,
        isVerified: false,
        hoursSpent: 0,
      })
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should handle max realistic inputs', () => {
      const score = AdvancedScoringAlgorithm.calculateTotalScore({
        weight: 10,
        difficulty: 5,
        urgency: 5,
        membersCount: 20,
        completionPercentage: 100,
        isVerified: true,
        hoursSpent: 10,
      })
      expect(score).toBeGreaterThan(70)
      expect(score).toBeLessThanOrEqual(100)
    })
  })
})
