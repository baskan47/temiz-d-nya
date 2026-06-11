import 'package:hive/hive.dart';
import 'package:hive_flutter/hive_flutter.dart';

class OfflineService {
  static final OfflineService _instance = OfflineService._internal();

  factory OfflineService() {
    return _instance;
  }

  OfflineService._internal();

  late Box<Map<String, dynamic>> _userBox;
  late Box<Map<String, dynamic>> _groupsBox;
  late Box<Map<String, dynamic>> _cleanupBox;

  Future<void> initializeHive() async {
    await Hive.initFlutter();
    _userBox = await Hive.openBox<Map<String, dynamic>>('users');
    _groupsBox = await Hive.openBox<Map<String, dynamic>>('groups');
    _cleanupBox = await Hive.openBox<Map<String, dynamic>>('cleanup_sessions');
  }

  // Kullanıcı verileri
  Future<void> saveUserData(String userId, Map<String, dynamic> userData) async {
    await _userBox.put(userId, userData);
  }

  Map<String, dynamic>? getUserData(String userId) {
    return _userBox.get(userId);
  }

  // Grup verileri
  Future<void> saveGroup(String groupId, Map<String, dynamic> groupData) async {
    await _groupsBox.put(groupId, groupData);
  }

  Map<String, dynamic>? getGroup(String groupId) {
    return _groupsBox.get(groupId);
  }

  List<Map<String, dynamic>> getAllGroups() {
    return _groupsBox.values.toList().cast<Map<String, dynamic>>();
  }

  // Temizlik oturum verileri
  Future<void> saveCleanupSession(String sessionId, Map<String, dynamic> sessionData) async {
    await _cleanupBox.put(sessionId, sessionData);
  }

  List<Map<String, dynamic>> getPendingCleanupSessions() {
    return _cleanupBox.values
        .where((session) => session['synced'] != true)
        .toList()
        .cast<Map<String, dynamic>>();
  }

  Future<void> markSessionAsSynced(String sessionId) async {
    final session = _cleanupBox.get(sessionId);
    if (session != null) {
      session['synced'] = true;
      await _cleanupBox.put(sessionId, session);
    }
  }
}
