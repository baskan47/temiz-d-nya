/// 📄 Pagination Helper für Flutter
/// Cursor-based pagination for Firestore queries

import 'package:cloud_firestore/cloud_firestore.dart';

class PaginationHelper {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  
  /// Fetch paginated reports
  Future<PaginatedResult<Map<String, dynamic>>> fetchReports({
    required int pageSize,
    DocumentSnapshot? lastVisible,
    List<String>? statuses,
  }) async {
    try {
      Query query = _db.collection('reports');
      
      // Apply filters
      if (statuses != null && statuses.isNotEmpty) {
        query = query.where('status', whereIn: statuses);
      }
      
      // Order by creation date
      query = query.orderBy('createdAt', descending: true);
      
      // Apply cursor
      if (lastVisible != null) {
        query = query.startAfterDocument(lastVisible);
      }
      
      // Limit
      query = query.limit(pageSize + 1); // +1 to check if there are more
      
      QuerySnapshot snap = await query.get();
      
      bool hasMore = snap.docs.length > pageSize;
      List<DocumentSnapshot> docs = snap.docs.take(pageSize).toList();
      
      List<Map<String, dynamic>> data = docs
          .map((doc) => {'id': doc.id, ...doc.data() as Map<String, dynamic>})
          .toList();
      
      DocumentSnapshot? newLastVisible = docs.isNotEmpty ? docs.last : null;
      
      return PaginatedResult(
        data: data,
        lastVisible: newLastVisible,
        hasMore: hasMore,
      );
    } catch (e) {
      print('Fetch reports pagination error: $e');
      throw e;
    }
  }
  
  /// Fetch paginated groups
  Future<PaginatedResult<Map<String, dynamic>>> fetchGroups({
    required int pageSize,
    DocumentSnapshot? lastVisible,
  }) async {
    try {
      Query query = _db.collection('groups')
          .orderBy('createdAt', descending: true);
      
      if (lastVisible != null) {
        query = query.startAfterDocument(lastVisible);
      }
      
      query = query.limit(pageSize + 1);
      
      QuerySnapshot snap = await query.get();
      
      bool hasMore = snap.docs.length > pageSize;
      List<DocumentSnapshot> docs = snap.docs.take(pageSize).toList();
      
      List<Map<String, dynamic>> data = docs
          .map((doc) => {'id': doc.id, ...doc.data() as Map<String, dynamic>})
          .toList();
      
      DocumentSnapshot? newLastVisible = docs.isNotEmpty ? docs.last : null;
      
      return PaginatedResult(
        data: data,
        lastVisible: newLastVisible,
        hasMore: hasMore,
      );
    } catch (e) {
      print('Fetch groups pagination error: $e');
      throw e;
    }
  }
  
  /// Fetch paginated verifications (admin only)
  Future<PaginatedResult<Map<String, dynamic>>> fetchVerifications({
    required int pageSize,
    DocumentSnapshot? lastVisible,
  }) async {
    try {
      Query query = _db.collection('photo_verifications')
          .where('status', isEqualTo: 'manual_review')
          .orderBy('createdAt', descending: true);
      
      if (lastVisible != null) {
        query = query.startAfterDocument(lastVisible);
      }
      
      query = query.limit(pageSize + 1);
      
      QuerySnapshot snap = await query.get();
      
      bool hasMore = snap.docs.length > pageSize;
      List<DocumentSnapshot> docs = snap.docs.take(pageSize).toList();
      
      List<Map<String, dynamic>> data = docs
          .map((doc) => {'id': doc.id, ...doc.data() as Map<String, dynamic>})
          .toList();
      
      DocumentSnapshot? newLastVisible = docs.isNotEmpty ? docs.last : null;
      
      return PaginatedResult(
        data: data,
        lastVisible: newLastVisible,
        hasMore: hasMore,
      );
    } catch (e) {
      print('Fetch verifications pagination error: $e');
      throw e;
    }
  }
  
  /// Fetch user's cleanup sessions
  Future<PaginatedResult<Map<String, dynamic>>> fetchUserSessions({
    required String userId,
    required int pageSize,
    DocumentSnapshot? lastVisible,
  }) async {
    try {
      Query query = _db.collection('cleanup_sessions')
          .where('userId', isEqualTo: userId)
          .orderBy('createdAt', descending: true);
      
      if (lastVisible != null) {
        query = query.startAfterDocument(lastVisible);
      }
      
      query = query.limit(pageSize + 1);
      
      QuerySnapshot snap = await query.get();
      
      bool hasMore = snap.docs.length > pageSize;
      List<DocumentSnapshot> docs = snap.docs.take(pageSize).toList();
      
      List<Map<String, dynamic>> data = docs
          .map((doc) => {'id': doc.id, ...doc.data() as Map<String, dynamic>})
          .toList();
      
      DocumentSnapshot? newLastVisible = docs.isNotEmpty ? docs.last : null;
      
      return PaginatedResult(
        data: data,
        lastVisible: newLastVisible,
        hasMore: hasMore,
      );
    } catch (e) {
      print('Fetch user sessions pagination error: $e');
      throw e;
    }
  }
  
  /// Get total count of collection with optional filter
  Future<int> getCount(
    String collectionName, {
    String? whereField,
    dynamic whereValue,
  }) async {
    try {
      Query query = _db.collection(collectionName);
      
      if (whereField != null && whereValue != null) {
        query = query.where(whereField, isEqualTo: whereValue);
      }
      
      AggregateQuery aggregateQuery = query.count();
      AggregateQuerySnapshot snap = await aggregateQuery.get();
      
      return snap.count ?? 0;
    } catch (e) {
      print('Get count error for $collectionName: $e');
      return 0;
    }
  }
}

/// 📊 Paginated Result Model
class PaginatedResult<T> {
  final List<T> data;
  final DocumentSnapshot? lastVisible;
  final bool hasMore;
  
  PaginatedResult({
    required this.data,
    required this.lastVisible,
    required this.hasMore,
  });
  
  bool get isEmpty => data.isEmpty;
  bool get isNotEmpty => data.isNotEmpty;
  int get length => data.length;
}

/// 📋 Pagination Controller (for UI state management)
class PaginationController {
  final List<Map<String, dynamic>> allItems = [];
  DocumentSnapshot? lastVisible;
  bool hasMore = true;
  bool isLoading = false;
  
  int get currentPage => (allItems.length / 10).ceil(); // Assuming 10 items per page
  int get totalItems => allItems.length;
  
  /// Reset pagination
  void reset() {
    allItems.clear();
    lastVisible = null;
    hasMore = true;
    isLoading = false;
  }
  
  /// Add paginated results
  void addResults(PaginatedResult result) {
    allItems.addAll(result.data as List<Map<String, dynamic>>);
    lastVisible = result.lastVisible;
    hasMore = result.hasMore;
    isLoading = false;
  }
  
  /// Clear all data
  void clear() {
    allItems.clear();
    lastVisible = null;
    hasMore = true;
    isLoading = false;
  }
}
