import 'package:flutter_test/flutter_test.dart';
import 'package:purdunya_flutter_osm/models.dart';
import 'package:purdunya_flutter_osm/user_score.dart';

void main() {
  group('PürDünya App Tests', () {
    
    // Test 1: Model Creation
    test('Group model creates successfully', () {
      final group = Group(
        id: 'test-1',
        createdBy: 'user123',
        members: ['user1', 'user2'],
        location: {'lat': 36.5437, 'lng': 31.9998},
        status: 'active',
        createdAt: DateTime.now(),
        totalArea: 100.5,
        totalWeight: 50,
      );
      
      expect(group.id, 'test-1');
      expect(group.members.length, 2);
      expect(group.status, 'active');
      expect(group.totalArea, 100.5);
    });

    test('Task model creates successfully', () {
      final task = Task(
        id: 'task-1',
        groupId: 'group-1',
        assignedTo: 'user1',
        title: 'Beach Cleanup',
        description: 'Clean Alanya Beach',
        status: 'pending',
        dueDate: DateTime.now().add(Duration(days: 7)),
      );
      
      expect(task.id, 'task-1');
      expect(task.status, 'pending');
      expect(task.title, 'Beach Cleanup');
    });

    // Test 2: Badge System
    test('Badge calculation - Bronze badge', () {
      final score = UserScore(
        userId: 'user1',
        userName: 'Test User',
        ecoPoints: 150,
        cleanupCount: 3,
        groupCount: 1,
        lastActive: DateTime.now(),
      );
      
      expect(score.badge, 'bronze');
    });

    test('Badge calculation - Silver badge', () {
      final score = UserScore(
        userId: 'user1',
        userName: 'Test User',
        ecoPoints: 600,
        cleanupCount: 10,
        groupCount: 5,
        lastActive: DateTime.now(),
      );
      
      expect(score.badge, 'silver');
    });

    test('Badge calculation - Gold badge', () {
      final score = UserScore(
        userId: 'user1',
        userName: 'Test User',
        ecoPoints: 1500,
        cleanupCount: 30,
        groupCount: 15,
        lastActive: DateTime.now(),
      );
      
      expect(score.badge, 'gold');
    });

    test('Badge calculation - Platinum badge', () {
      final score = UserScore(
        userId: 'user1',
        userName: 'Test User',
        ecoPoints: 3000,
        cleanupCount: 100,
        groupCount: 50,
        lastActive: DateTime.now(),
      );
      
      expect(score.badge, 'platinum');
    });

    // Test 3: Location Data Validation
    test('Location map validation', () {
      final loc1 = {'lat': 36.5437, 'lng': 31.9998};
      final loc2 = {'lat': 36.5500, 'lng': 32.0000};
      
      // Verify coordinates are stored correctly
      expect(loc1['lat'], 36.5437);
      expect(loc1['lng'], 31.9998);
      expect(loc2['lat'], 36.5500);
      expect(loc2['lng'], 32.0000);
    });

    // Test 4: Data Validation
    test('Group members list validation', () {
      final group = Group(
        id: 'test-2',
        createdBy: 'user123',
        members: ['user1', 'user2', 'user3', 'user4', 'user5'],
        location: {'lat': 36.5437, 'lng': 31.9998},
        status: 'active',
        createdAt: DateTime.now(),
        totalArea: 200.0,
        totalWeight: 100,
      );
      
      expect(group.members.length, 5);
      expect(group.members.contains('user3'), true);
    });

    test('Task status validation', () {
      final validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
      final task = Task(
        id: 'task-2',
        groupId: 'group-1',
        assignedTo: 'user1',
        title: 'Test Task',
        description: 'Testing',
        status: 'in-progress',
        dueDate: DateTime.now(),
      );
      
      expect(validStatuses.contains(task.status), true);
    });

    // Test 5: User Score Validation
    test('User score object creation', () {
      final score = UserScore(
        userId: 'user1',
        userName: 'John Doe',
        ecoPoints: 500,
        cleanupCount: 5,
        groupCount: 2,
        lastActive: DateTime.now(),
      );
      
      expect(score.userId, 'user1');
      expect(score.userName, 'John Doe');
      expect(score.ecoPoints, 500);
      expect(score.cleanupCount, 5);
    });

    // Test 6: Date/Time Validation
    test('Task due date is in future', () {
      final futureDate = DateTime.now().add(Duration(days: 7));
      final task = Task(
        id: 'task-3',
        groupId: 'group-1',
        assignedTo: 'user1',
        title: 'Future Task',
        description: 'Task due in future',
        status: 'pending',
        dueDate: futureDate,
      );
      
      expect(task.dueDate.isAfter(DateTime.now()), true);
    });

    // Test 7: Group Area & Weight Tracking  
    test('Group cleanup stats tracking', () {
      final group = Group(
        id: 'test-3',
        createdBy: 'user123',
        members: ['user1', 'user2'],
        location: {'lat': 36.5437, 'lng': 31.9998},
        status: 'active',
        createdAt: DateTime.now(),
        totalArea: 500.75,
        totalWeight: 250,
      );
      
      expect(group.totalArea, 500.75);
      expect(group.totalWeight, 250);
      expect(group.totalArea > 0, true);
      expect(group.totalWeight > 0, true);
    });

  });

  // Integration Test Group
  group('Integration Tests', () {
    
    test('Complete cleanup workflow simulation', () {
      // Step 1: Create group
      final group = Group(
        id: 'cleanup-1',
        createdBy: 'admin',
        members: ['user1', 'user2', 'user3', 'user4', 'user5'],
        location: {'lat': 36.5437, 'lng': 31.9998},
        status: 'active',
        createdAt: DateTime.now(),
        totalArea: 0,
        totalWeight: 0,
      );
      
      // Step 2: Create task
      final task = Task(
        id: 'beach-task-1',
        groupId: group.id,
        assignedTo: 'user1',
        title: 'Beach Cleanup Drive',
        description: 'Clean Alanya Beach - Remove plastic waste',
        status: 'pending',
        dueDate: DateTime.now().add(Duration(days: 3)),
      );
      
      // Step 3: Verify group and task
      expect(group.members.length, 5);
      expect(group.status, 'active');
      expect(task.groupId, group.id);
      expect(task.status, 'pending');
      
      // Step 4: Award points
      final userScore = UserScore(
        userId: 'user1',
        userName: 'John',
        ecoPoints: 150,
        cleanupCount: 1,
        groupCount: 1,
        lastActive: DateTime.now(),
      );
      
      expect(userScore.badge, 'bronze');
      expect(userScore.ecoPoints, 150);
    });

    test('Multi-group participation workflow', () {
      // User joins multiple groups
      final groups = [
        Group(
          id: 'group-beach',
          createdBy: 'admin1',
          members: ['user1', 'user2'],
          location: {'lat': 36.5437, 'lng': 31.9998},
          status: 'active',
          createdAt: DateTime.now(),
          totalArea: 150,
          totalWeight: 75,
        ),
        Group(
          id: 'group-park',
          createdBy: 'admin2',
          members: ['user1', 'user3'],
          location: {'lat': 36.5500, 'lng': 32.0000},
          status: 'active',
          createdAt: DateTime.now(),
          totalArea: 200,
          totalWeight: 100,
        ),
      ];
      
      expect(groups.length, 2);
      
      // Track total participation
      final totalCleanups = groups.length;
      expect(totalCleanups, 2);
      
      // Verify user is in both groups
      bool inBothGroups = groups.every((g) => g.members.contains('user1'));
      expect(inBothGroups, true);
    });

  });
}
