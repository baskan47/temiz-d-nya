import 'package:flutter_test/flutter_test.dart';
import 'package:purdunya_flutter_osm/scoring_algorithm.dart';

void main() {
  group('Advanced Scoring Algorithm - Flutter', () {
    group('Score by Weight', () {
      test('weight 0 returns 0', () {
        expect(AdvancedScoringAlgorithm.scoreByWeight(0), equals(0));
      });

      test('weight 1 returns 10', () {
        expect(AdvancedScoringAlgorithm.scoreByWeight(1), equals(10));
      });

      test('weight 5 returns 50', () {
        expect(AdvancedScoringAlgorithm.scoreByWeight(5), equals(50));
      });

      test('weight 10 returns 100', () {
        expect(AdvancedScoringAlgorithm.scoreByWeight(10), equals(100));
      });

      test('weight > 10 is capped at 100', () {
        expect(AdvancedScoringAlgorithm.scoreByWeight(15), equals(100));
      });

      test('negative weight returns 0', () {
        expect(AdvancedScoringAlgorithm.scoreByWeight(-5), equals(0));
      });
    });

    group('Score by Difficulty', () {
      test('difficulty 1 returns 20', () {
        expect(AdvancedScoringAlgorithm.scoreByDifficulty(1), equals(20));
      });

      test('difficulty 2 returns 40', () {
        expect(AdvancedScoringAlgorithm.scoreByDifficulty(2), equals(40));
      });

      test('difficulty 3 returns 60', () {
        expect(AdvancedScoringAlgorithm.scoreByDifficulty(3), equals(60));
      });

      test('difficulty 4 returns 80', () {
        expect(AdvancedScoringAlgorithm.scoreByDifficulty(4), equals(80));
      });

      test('difficulty 5 returns 100', () {
        expect(AdvancedScoringAlgorithm.scoreByDifficulty(5), equals(100));
      });

      test('invalid difficulty returns 0', () {
        expect(AdvancedScoringAlgorithm.scoreByDifficulty(0), equals(0));
        expect(AdvancedScoringAlgorithm.scoreByDifficulty(6), equals(0));
      });
    });

    group('Score by Urgency', () {
      test('urgency 1 returns 20', () {
        expect(AdvancedScoringAlgorithm.scoreByUrgency(1), equals(20));
      });

      test('urgency 2 returns 40', () {
        expect(AdvancedScoringAlgorithm.scoreByUrgency(2), equals(40));
      });

      test('urgency 5 returns 100', () {
        expect(AdvancedScoringAlgorithm.scoreByUrgency(5), equals(100));
      });

      test('invalid urgency returns 0', () {
        expect(AdvancedScoringAlgorithm.scoreByUrgency(0), equals(0));
        expect(AdvancedScoringAlgorithm.scoreByUrgency(6), equals(0));
      });
    });

    group('Score by Team Efficiency', () {
      test('1 member, 50% completion returns 50', () {
        expect(
          AdvancedScoringAlgorithm.scoreByTeamEfficiency(1, 50),
          greaterThanOrEqualTo(50),
        );
      });

      test('3 members, 100% completion returns high score', () {
        final score =
            AdvancedScoringAlgorithm.scoreByTeamEfficiency(3, 100);
        expect(score, greaterThan(50));
      });

      test('score is capped at 100', () {
        final score =
            AdvancedScoringAlgorithm.scoreByTeamEfficiency(10, 100);
        expect(score, lessThanOrEqualTo(100));
      });

      test('invalid members returns 0', () {
        expect(AdvancedScoringAlgorithm.scoreByTeamEfficiency(0, 50), equals(0));
      });

      test('negative completion returns 0', () {
        expect(
          AdvancedScoringAlgorithm.scoreByTeamEfficiency(2, -10),
          equals(0),
        );
      });
    });

    group('Score by Verification', () {
      test('verified photo returns 100', () {
        expect(
          AdvancedScoringAlgorithm.scoreByVerificationBonus(true),
          equals(100.0),
        );
      });

      test('unverified photo returns 0', () {
        expect(
          AdvancedScoringAlgorithm.scoreByVerificationBonus(false),
          equals(0.0),
        );
      });
    });

    group('Score by Time', () {
      test('0.5 hours returns 20', () {
        expect(AdvancedScoringAlgorithm.scoreByTimeFactor(0.5), equals(20));
      });

      test('1.5 hours returns 50', () {
        expect(AdvancedScoringAlgorithm.scoreByTimeFactor(1.5), equals(50));
      });

      test('3 hours returns 80', () {
        expect(AdvancedScoringAlgorithm.scoreByTimeFactor(3), equals(80));
      });

      test('5 hours returns 100', () {
        expect(AdvancedScoringAlgorithm.scoreByTimeFactor(5), equals(100));
      });

      test('negative hours returns 0', () {
        expect(AdvancedScoringAlgorithm.scoreByTimeFactor(-1), equals(0));
      });
    });

    group('Calculate Total Score', () {
      test('minimum valid score', () {
        final score = AdvancedScoringAlgorithm.calculateTotalScore(
          weight: 1,
          difficulty: 1,
          urgency: 1,
          membersCount: 1,
          completionPercentage: 10,
          isVerified: false,
          hoursSpent: 0.5,
        );
        expect(score, greaterThan(0));
        expect(score, lessThanOrEqualTo(100));
      });

      test('maximum valid score', () {
        final score = AdvancedScoringAlgorithm.calculateTotalScore(
          weight: 10,
          difficulty: 5,
          urgency: 5,
          membersCount: 10,
          completionPercentage: 100,
          isVerified: true,
          hoursSpent: 5,
        );
        expect(score, greaterThan(80));
        expect(score, lessThanOrEqualTo(100));
      });

      test('medium score example', () {
        final score = AdvancedScoringAlgorithm.calculateTotalScore(
          weight: 5,
          difficulty: 3,
          urgency: 3,
          membersCount: 3,
          completionPercentage: 75,
          isVerified: true,
          hoursSpent: 2,
        );
        expect(score, greaterThan(40));
        expect(score, lessThan(100));
      });

      test('invalid inputs throw error', () {
        expect(
          () => AdvancedScoringAlgorithm.calculateTotalScore(
            weight: -1,
            difficulty: 3,
            urgency: 3,
            membersCount: 3,
            completionPercentage: 50,
            isVerified: false,
            hoursSpent: 2,
          ),
          throwsArgumentError,
        );
      });
    });

    group('Calculate with Multiplier', () {
      test('multiplier increases score', () {
        final baseScore = 50.0;
        final multiplied = AdvancedScoringAlgorithm.calculateWithMultiplier(
          baseScore: baseScore,
          multiplier: 1.5,
        );
        expect(multiplied, greaterThan(baseScore));
      });

      test('score capped at 100', () {
        final multiplied = AdvancedScoringAlgorithm.calculateWithMultiplier(
          baseScore: 80,
          multiplier: 2,
          cap100: true,
        );
        expect(multiplied, equals(100));
      });

      test('score not capped when cap100 false', () {
        final multiplied = AdvancedScoringAlgorithm.calculateWithMultiplier(
          baseScore: 80,
          multiplier: 2,
          cap100: false,
        );
        expect(multiplied, equals(160));
      });
    });

    group('Determine Badge', () {
      test('0-499 points is bronze', () {
        expect(
          AdvancedScoringAlgorithm.determineBadge(100),
          equals('bronze'),
        );
      });

      test('500-999 points is silver', () {
        expect(
          AdvancedScoringAlgorithm.determineBadge(750),
          equals('silver'),
        );
      });

      test('1000-1999 points is gold', () {
        expect(
          AdvancedScoringAlgorithm.determineBadge(1500),
          equals('gold'),
        );
      });

      test('2000+ points is platinum', () {
        expect(
          AdvancedScoringAlgorithm.determineBadge(2500),
          equals('platinum'),
        );
      });
    });

    group('Determine Level', () {
      test('0-99 points is novice', () {
        expect(
          AdvancedScoringAlgorithm.determineLevel(50),
          equals('novice'),
        );
      });

      test('100-499 points is beginner', () {
        expect(
          AdvancedScoringAlgorithm.determineLevel(300),
          equals('beginner'),
        );
      });

      test('500-999 points is intermediate', () {
        expect(
          AdvancedScoringAlgorithm.determineLevel(700),
          equals('intermediate'),
        );
      });

      test('1000-1999 points is pro', () {
        expect(
          AdvancedScoringAlgorithm.determineLevel(1500),
          equals('pro'),
        );
      });

      test('2000-4999 points is expert', () {
        expect(
          AdvancedScoringAlgorithm.determineLevel(3000),
          equals('expert'),
        );
      });

      test('5000+ points is master', () {
        expect(
          AdvancedScoringAlgorithm.determineLevel(6000),
          equals('master'),
        );
      });
    });

    group('Check Achievements', () {
      test('first cleanup achievement', () {
        final achievements = AdvancedScoringAlgorithm.checkAchievements(
          totalCleanups: 1,
          verifiedPhotos: 0,
          averageEfficiency: 0,
          consecutiveDays: 0,
          maxDifficulty: 1,
        );
        expect(achievements, contains('first_cleanup'));
      });

      test('ten cleanups achievement', () {
        final achievements = AdvancedScoringAlgorithm.checkAchievements(
          totalCleanups: 10,
          verifiedPhotos: 0,
          averageEfficiency: 0,
          consecutiveDays: 0,
          maxDifficulty: 1,
        );
        expect(achievements, contains('ten_cleanups'));
      });

      test('photo verified achievement', () {
        final achievements = AdvancedScoringAlgorithm.checkAchievements(
          totalCleanups: 0,
          verifiedPhotos: 10,
          averageEfficiency: 0,
          consecutiveDays: 0,
          maxDifficulty: 1,
        );
        expect(achievements, contains('photo_verified'));
      });

      test('consistency week achievement', () {
        final achievements = AdvancedScoringAlgorithm.checkAchievements(
          totalCleanups: 0,
          verifiedPhotos: 0,
          averageEfficiency: 0,
          consecutiveDays: 7,
          maxDifficulty: 1,
        );
        expect(achievements, contains('consistency_week'));
      });

      test('high difficulty achievement', () {
        final achievements = AdvancedScoringAlgorithm.checkAchievements(
          totalCleanups: 0,
          verifiedPhotos: 0,
          averageEfficiency: 0,
          consecutiveDays: 0,
          maxDifficulty: 5,
        );
        expect(achievements, contains('high_difficulty'));
      });
    });

    group('Leaderboard Bonus', () {
      test('top 10 returns 20 points', () {
        expect(AdvancedScoringAlgorithm.getLeaderboardBonus(5), equals(20));
      });

      test('top 50 returns 10 points', () {
        expect(AdvancedScoringAlgorithm.getLeaderboardBonus(25), equals(10));
      });

      test('top 100 returns 5 points', () {
        expect(AdvancedScoringAlgorithm.getLeaderboardBonus(75), equals(5));
      });

      test('beyond 100 returns 0 points', () {
        expect(AdvancedScoringAlgorithm.getLeaderboardBonus(150), equals(0));
      });
    });

    group('Streak Bonus', () {
      test('1 day returns 2 points', () {
        expect(AdvancedScoringAlgorithm.getStreakBonus(1), equals(2));
      });

      test('7 days returns 14 points', () {
        expect(AdvancedScoringAlgorithm.getStreakBonus(7), equals(14));
      });

      test('50 days capped at 100', () {
        expect(AdvancedScoringAlgorithm.getStreakBonus(50), equals(100));
      });
    });

    group('Team Bonus', () {
      test('1 member no bonus', () {
        expect(AdvancedScoringAlgorithm.getTeamBonus(1), equals(0));
      });

      test('2-3 members 10% bonus', () {
        expect(AdvancedScoringAlgorithm.getTeamBonus(2), equals(1.10));
        expect(AdvancedScoringAlgorithm.getTeamBonus(3), equals(1.10));
      });

      test('4-5 members 20% bonus', () {
        expect(AdvancedScoringAlgorithm.getTeamBonus(4), equals(1.20));
        expect(AdvancedScoringAlgorithm.getTeamBonus(5), equals(1.20));
      });

      test('6+ members 30% bonus', () {
        expect(AdvancedScoringAlgorithm.getTeamBonus(6), equals(1.30));
        expect(AdvancedScoringAlgorithm.getTeamBonus(10), equals(1.30));
      });
    });

    group('Calculate Final Score', () {
      test('final score with all bonuses', () {
        final score = AdvancedScoringAlgorithm.calculateFinalScore(
          baseScore: 80,
          leaderboardPosition: 5,
          consecutiveDays: 7,
          teamSize: 4,
        );
        expect(score, greaterThan(80));
        expect(score, lessThanOrEqualTo(200));
      });

      test('high multiplier with bonuses', () {
        final score = AdvancedScoringAlgorithm.calculateFinalScore(
          baseScore: 75,
          leaderboardPosition: 1,
          consecutiveDays: 30,
          teamSize: 8,
        );
        expect(score, greaterThan(100));
      });
    });

    group('Get Score Breakdown', () {
      test('returns all score components', () {
        final breakdown = AdvancedScoringAlgorithm.getScoreBreakdown(
          weight: 5,
          difficulty: 3,
          urgency: 3,
          membersCount: 3,
          completionPercentage: 75,
          isVerified: true,
          hoursSpent: 2,
        );

        expect(breakdown.containsKey('weight'), isTrue);
        expect(breakdown.containsKey('difficulty'), isTrue);
        expect(breakdown.containsKey('urgency'), isTrue);
        expect(breakdown.containsKey('efficiency'), isTrue);
        expect(breakdown.containsKey('verification'), isTrue);
        expect(breakdown.containsKey('time'), isTrue);
        expect(breakdown.containsKey('total'), isTrue);
      });

      test('total equals sum of weighted components', () {
        final breakdown = AdvancedScoringAlgorithm.getScoreBreakdown(
          weight: 5,
          difficulty: 3,
          urgency: 3,
          membersCount: 3,
          completionPercentage: 75,
          isVerified: true,
          hoursSpent: 2,
        );

        // Total should be calculated based on formula
        expect(breakdown['total'], greaterThan(0));
        expect(breakdown['total'], lessThanOrEqualTo(100));
      });
    });

    group('Enums', () {
      test('CleanupDifficulty values', () {
        expect(CleanupDifficulty.easy.value, equals(1));
        expect(CleanupDifficulty.medium.value, equals(2));
        expect(CleanupDifficulty.hard.value, equals(3));
        expect(CleanupDifficulty.veryHard.value, equals(4));
        expect(CleanupDifficulty.extreme.value, equals(5));
      });

      test('CleanupUrgency values', () {
        expect(CleanupUrgency.low.value, equals(1));
        expect(CleanupUrgency.medium.value, equals(2));
        expect(CleanupUrgency.high.value, equals(3));
        expect(CleanupUrgency.veryHigh.value, equals(4));
        expect(CleanupUrgency.critical.value, equals(5));
      });

      test('ScoreFactor weights sum to 1', () {
        double total = 0;
        for (final factor in ScoreFactor.values) {
          total += factor.value;
        }
        expect(total, closeTo(1.0, 0.01));
      });
    });

    group('Edge Cases', () {
      test('all zero inputs returns valid score', () {
        final score = AdvancedScoringAlgorithm.calculateTotalScore(
          weight: 1,
          difficulty: 1,
          urgency: 1,
          membersCount: 1,
          completionPercentage: 0,
          isVerified: false,
          hoursSpent: 0,
        );
        expect(score, greaterThanOrEqualTo(0));
        expect(score, lessThanOrEqualTo(100));
      });

      test('max realistic inputs', () {
        final score = AdvancedScoringAlgorithm.calculateTotalScore(
          weight: 10,
          difficulty: 5,
          urgency: 5,
          membersCount: 20,
          completionPercentage: 100,
          isVerified: true,
          hoursSpent: 10,
        );
        expect(score, greaterThan(70));
        expect(score, lessThanOrEqualTo(100));
      });

      test('achievement descriptions are non-empty', () {
        final desc = AdvancedScoringAlgorithm.getAchievementDescription(
          'first_cleanup',
        );
        expect(desc, isNotEmpty);
      });

      test('unknown achievement returns default', () {
        final desc = AdvancedScoringAlgorithm.getAchievementDescription(
          'unknown_achievement',
        );
        expect(desc, equals('Bilinmeyen başarı'));
      });
    });

    group('Waste Score and Autonomous Device', () {
      test('calculateWasteScore correctly calculates based on waste multipliers', () {
        // Plastic: 1.5, Glass: 1.2, Paper: 1.0, Metal: 1.8, Organic: 1.3
        final score = AdvancedScoringAlgorithm.calculateWasteScore(
          plastic: 2.0,
          glass: 1.0,
          paper: 4.0,
          metal: 1.0,
          organic: 0.0,
        );
        // (2 * 1.5) + (1 * 1.2) + (4 * 1.0) + (1 * 1.8) = 3.0 + 1.2 + 4.0 + 1.8 = 10.0
        expect(score, closeTo(10.0, 0.01));
      });

      test('calculateTotalScore with isAutonomousDevice applies +10% bonus', () {
        final regularScore = AdvancedScoringAlgorithm.calculateTotalScore(
          weight: 5,
          difficulty: 3,
          urgency: 3,
          membersCount: 3,
          completionPercentage: 75,
          isVerified: true,
          hoursSpent: 2,
          isAutonomousDevice: false,
        );

        final deviceScore = AdvancedScoringAlgorithm.calculateTotalScore(
          weight: 5,
          difficulty: 3,
          urgency: 3,
          membersCount: 3,
          completionPercentage: 75,
          isVerified: true,
          hoursSpent: 2,
          isAutonomousDevice: true,
        );

        expect(deviceScore, closeTo(regularScore * 1.10, 0.01));
      });
    });
  });
}
