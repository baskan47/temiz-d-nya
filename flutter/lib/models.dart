import 'package:cloud_firestore/cloud_firestore.dart';

class Group {
  final String id;
  final String createdBy;
  final List<String> members;
  final Map<String, dynamic> location;
  final String status;
  final DateTime createdAt;
  final double totalArea;
  final int totalWeight;
  final String? targetReportId;
  final List<String> readyMembers;

  Group({
    required this.id,
    required this.createdBy,
    required this.members,
    required this.location,
    required this.status,
    required this.createdAt,
    this.totalArea = 0,
    this.totalWeight = 0,
    this.targetReportId,
    this.readyMembers = const [],
  });

  factory Group.fromMap(String id, Map<String, dynamic> data) {
    return Group(
      id: id,
      createdBy: data['createdBy'] ?? '',
      members: List<String>.from(data['members'] ?? []),
      location: data['location'] ?? {},
      status: data['status'] ?? 'open',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      totalArea: (data['totalArea'] ?? 0).toDouble(),
      totalWeight: data['totalWeight'] ?? 0,
      targetReportId: data['targetReportId'],
      readyMembers: List<String>.from(data['readyMembers'] ?? []),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'createdBy': createdBy,
      'members': members,
      'location': location,
      'status': status,
      'totalArea': totalArea,
      'totalWeight': totalWeight,
      'targetReportId': targetReportId,
      'readyMembers': readyMembers,
    };
  }
}

class Task {
  final String id;
  final String groupId;
  final String assignedTo;
  final String title;
  final String description;
  final String status;
  final DateTime dueDate;

  Task({
    required this.id,
    required this.groupId,
    required this.assignedTo,
    required this.title,
    required this.description,
    required this.status,
    required this.dueDate,
  });

  factory Task.fromMap(String id, Map<String, dynamic> data) {
    return Task(
      id: id,
      groupId: data['groupId'] ?? '',
      assignedTo: data['assignedTo'] ?? '',
      title: data['title'] ?? '',
      description: data['description'] ?? '',
      status: data['status'] ?? 'pending',
      dueDate: (data['dueDate'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'groupId': groupId,
      'assignedTo': assignedTo,
      'title': title,
      'description': description,
      'status': status,
      'dueDate': dueDate,
    };
  }
}

class AutonomousDevice {
  final String id;
  final String name;
  final String status; // active, full, maintenance, offline
  final double latitude;
  final double longitude;
  final int batteryLevel;
  final Map<String, double> fillRates; // 'plastic', 'glass', 'paper', 'metal'
  final DateTime? lastServiced;
  final DateTime createdAt;

  AutonomousDevice({
    required this.id,
    required this.name,
    required this.status,
    required this.latitude,
    required this.longitude,
    required this.batteryLevel,
    required this.fillRates,
    this.lastServiced,
    required this.createdAt,
  });

  factory AutonomousDevice.fromMap(String id, Map<String, dynamic> data) {
    // Safely parse fillRates Map to Map<String, double>
    final rawFillRates = data['fill_rates'] as Map<dynamic, dynamic>? ?? {};
    final Map<String, double> parsedFillRates = {};
    rawFillRates.forEach((key, value) {
      parsedFillRates[key.toString()] = (value as num?)?.toDouble() ?? 0.0;
    });

    final lastServicedRaw = data['last_serviced'];
    final createdAtRaw = data['created_at'];

    return AutonomousDevice(
      id: id,
      name: data['device_name'] ?? data['name'] ?? '',
      status: data['status'] ?? 'active',
      latitude: (data['location']?['latitude'] ?? data['latitude'] ?? 0.0).toDouble(),
      longitude: (data['location']?['longitude'] ?? data['longitude'] ?? 0.0).toDouble(),
      batteryLevel: (data['battery_level'] ?? data['batteryLevel'] ?? 100).toInt(),
      fillRates: parsedFillRates,
      lastServiced: lastServicedRaw is Timestamp ? lastServicedRaw.toDate() : (lastServicedRaw != null ? DateTime.tryParse(lastServicedRaw.toString()) : null),
      createdAt: createdAtRaw is Timestamp ? createdAtRaw.toDate() : (createdAtRaw != null ? DateTime.tryParse(createdAtRaw.toString()) ?? DateTime.now() : DateTime.now()),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'device_name': name,
      'status': status,
      'location': {
        'latitude': latitude,
        'longitude': longitude,
      },
      'battery_level': batteryLevel,
      'fill_rates': fillRates,
      'last_serviced': lastServiced != null ? Timestamp.fromDate(lastServiced!) : null,
      'created_at': Timestamp.fromDate(createdAt),
    };
  }

  // Get total fill rate average
  double get totalFillRate {
    if (fillRates.isEmpty) return 0.0;
    final sum = fillRates.values.reduce((a, b) => a + b);
    return sum / fillRates.length;
  }
}

class PointTransaction {
  final String id;
  final String userId;
  final String type; // earn, spend
  final String source; // cleanup_session, recycled_at_device, bonus_streak, admin_award
  final String referenceId;
  final double pointsAmount;
  final Map<String, double>? wasteDetails;
  final DateTime timestamp;

  PointTransaction({
    required this.id,
    required this.userId,
    required this.type,
    required this.source,
    required this.referenceId,
    required this.pointsAmount,
    this.wasteDetails,
    required this.timestamp,
  });

  factory PointTransaction.fromMap(String id, Map<String, dynamic> data) {
    final rawWaste = data['waste_details'] as Map<dynamic, dynamic>?;
    Map<String, double>? parsedWaste;
    if (rawWaste != null) {
      parsedWaste = {};
      rawWaste.forEach((key, value) {
        parsedWaste![key.toString()] = (value as num?)?.toDouble() ?? 0.0;
      });
    }

    final tsRaw = data['timestamp'];

    return PointTransaction(
      id: id,
      userId: data['user_id'] ?? data['userId'] ?? '',
      type: data['type'] ?? 'earn',
      source: data['source'] ?? 'cleanup_session',
      referenceId: data['reference_id'] ?? data['referenceId'] ?? '',
      pointsAmount: (data['points_amount'] ?? data['points'] ?? 0.0).toDouble(),
      wasteDetails: parsedWaste,
      timestamp: tsRaw is Timestamp ? tsRaw.toDate() : (tsRaw != null ? DateTime.tryParse(tsRaw.toString()) ?? DateTime.now() : DateTime.now()),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'user_id': userId,
      'type': type,
      'source': source,
      'reference_id': referenceId,
      'points_amount': pointsAmount,
      if (wasteDetails != null) 'waste_details': wasteDetails,
      'timestamp': Timestamp.fromDate(timestamp),
    };
  }
}

class RewardItem {
  final String id;
  final String title;
  final String description;
  final int pointsCost;
  final String imageUrl;
  final String provider;
  final int stock;
  final bool isActive;
  final DateTime createdAt;

  RewardItem({
    required this.id,
    required this.title,
    required this.description,
    required this.pointsCost,
    required this.imageUrl,
    required this.provider,
    required this.stock,
    required this.isActive,
    required this.createdAt,
  });

  factory RewardItem.fromMap(String id, Map<String, dynamic> data) {
    final crRaw = data['created_at'];

    return RewardItem(
      id: id,
      title: data['title'] ?? '',
      description: data['description'] ?? '',
      pointsCost: (data['points_cost'] ?? data['pointsCost'] ?? 0).toInt(),
      imageUrl: data['image_url'] ?? data['imageUrl'] ?? '',
      provider: data['provider'] ?? '',
      stock: (data['stock'] ?? 0).toInt(),
      isActive: data['is_active'] ?? data['isActive'] ?? true,
      createdAt: crRaw is Timestamp ? crRaw.toDate() : (crRaw != null ? DateTime.tryParse(crRaw.toString()) ?? DateTime.now() : DateTime.now()),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'description': description,
      'points_cost': pointsCost,
      'image_url': imageUrl,
      'provider': provider,
      'stock': stock,
      'is_active': isActive,
      'created_at': Timestamp.fromDate(createdAt),
    };
  }
}

class RewardRedemption {
  final String id;
  final String userId;
  final String rewardId;
  final int pointsSpent;
  final String status; // pending, approved, shipped, cancelled
  final String redemptionCode;
  final Map<String, dynamic>? shippingAddress;
  final DateTime createdAt;
  final DateTime? processedAt;

  RewardRedemption({
    required this.id,
    required this.userId,
    required this.rewardId,
    required this.pointsSpent,
    required this.status,
    required this.redemptionCode,
    this.shippingAddress,
    required this.createdAt,
    this.processedAt,
  });

  factory RewardRedemption.fromMap(String id, Map<String, dynamic> data) {
    final crRaw = data['created_at'];
    final prRaw = data['processed_at'];

    return RewardRedemption(
      id: id,
      userId: data['user_id'] ?? data['userId'] ?? '',
      rewardId: data['reward_id'] ?? data['rewardId'] ?? '',
      pointsSpent: (data['points_spent'] ?? data['pointsSpent'] ?? 0).toInt(),
      status: data['status'] ?? 'pending',
      redemptionCode: data['redemption_code'] ?? data['redemptionCode'] ?? '',
      shippingAddress: data['shipping_address'] ?? data['shippingAddress'],
      createdAt: crRaw is Timestamp ? crRaw.toDate() : (crRaw != null ? DateTime.tryParse(crRaw.toString()) ?? DateTime.now() : DateTime.now()),
      processedAt: prRaw is Timestamp ? prRaw.toDate() : (prRaw != null ? DateTime.tryParse(prRaw.toString()) : null),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'user_id': userId,
      'reward_id': rewardId,
      'points_spent': pointsSpent,
      'status': status,
      'redemption_code': redemptionCode,
      if (shippingAddress != null) 'shipping_address': shippingAddress,
      'created_at': Timestamp.fromDate(createdAt),
      if (processedAt != null) 'processed_at': Timestamp.fromDate(processedAt!),
    };
  }
}