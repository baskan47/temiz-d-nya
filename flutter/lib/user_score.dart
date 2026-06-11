class UserScore {
  final String userId;
  final String userName;
  final double ecoPoints;
  final int cleanupCount;
  final int groupCount;
  final String badge;
  final DateTime lastActive;

  UserScore({
    required this.userId,
    required this.userName,
    required this.ecoPoints,
    required this.cleanupCount,
    required this.groupCount,
    String? badge,
    required this.lastActive,
  }) : this.badge = badge ?? _calculateBadge(ecoPoints);

  factory UserScore.fromMap(Map<String, dynamic> data) {
    return UserScore(
      userId: data['userId'] ?? '',
      userName: data['userName'] ?? 'Bilinmeyen',
      ecoPoints: (data['ecoPoints'] ?? 0).toDouble(),
      cleanupCount: data['cleanupCount'] ?? 0,
      groupCount: data['groupCount'] ?? 0,
      badge: _calculateBadge(data['ecoPoints'] ?? 0),
      lastActive: DateTime.parse(data['lastActive'] ?? DateTime.now().toString()),
    );
  }

  static String _calculateBadge(double points) {
    if (points >= 2000) return 'platinum';
    if (points >= 1000) return 'gold';
    if (points >= 500) return 'silver';
    return 'bronze';
  }

  String getBadgeEmoji() {
    switch (badge) {
      case 'platinum': return '💎';
      case 'gold': return '🏆';
      case 'silver': return '⭐';
      default: return '🥉';
    }
  }
}