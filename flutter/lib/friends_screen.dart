import 'package:flutter/material.dart';
import 'theme.dart';
import 'neomorphic_components.dart';
import 'auth_service.dart';
import 'firestore_service.dart';

class FriendsScreen extends StatefulWidget {
  @override
  _FriendsScreenState createState() => _FriendsScreenState();
}

class _FriendsScreenState extends State<FriendsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Topluluk",
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppTheme.primaryColor,
          tabs: const [
            Tab(text: "Arkadaşlar"),
            Tab(text: "İstekler"),
            Tab(text: "ID ile Ekle"),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildFriendList(),
          _buildRequestsList(),
          _buildAddFriend(),
        ],
      ),
    );
  }

  Widget _buildFriendList() {
    final currentUser = AuthService().currentUser;
    if (currentUser == null) return const Center(child: Text("Giriş yapmalısınız."));

    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: FirestoreService().watchFriends(currentUser.uid),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final friends = snapshot.data ?? [];
        if (friends.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.people_outline, size: 64, color: Colors.grey),
                SizedBox(height: 16),
                Text("Henüz arkadaşınız bulunmuyor.", style: TextStyle(color: Colors.grey)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: friends.length,
          itemBuilder: (context, index) {
            final friend = friends[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              elevation: 2,
              child: ListTile(
                contentPadding: const EdgeInsets.all(12),
                leading: CircleAvatar(
                  radius: 25,
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                  child: Text(friend['name'][0], style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
                ),
                title: Text(friend['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text("ID: ${friend['shortId']}"),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showFriendCard(friend),
              ),
            );
          },
        );
      },
    );
  }

  void _showFriendCard(Map<String, dynamic> friend) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 40,
              backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
              child: Text(friend['name'][0], style: TextStyle(color: AppTheme.primaryColor, fontSize: 30, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 16),
            Text(friend['name'], style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text("Gönüllü ID: ${friend['shortId']}", style: TextStyle(color: Colors.grey[600], fontSize: 12)),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _statItem("Puan", "${friend['ecoPoints']?.round() ?? 0} EP"),
                const SizedBox(width: 24),
                _statItem("Temizlik", "${friend['cleanupCount'] ?? 0}"),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Bu özellik bir sonraki güncellemede gelecek!")));
                },
                child: const Text("Birlikte Temizle Daveti Gönder", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 12),
            TextButton(onPressed: () => Navigator.pop(context), child: const Text("Kapat")),
          ],
        ),
      ),
    );
  }

  Widget _statItem(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green)),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ],
    );
  }

  Widget _buildRequestsList() {
    final currentUser = AuthService().currentUser;
    if (currentUser == null) return const Center(child: Text("Giriş yapmalısınız."));

    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: FirestoreService().watchIncomingRequests(currentUser.uid),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final requests = snapshot.data ?? [];
        if (requests.isEmpty) {
          return const Center(child: Text("Gelen istek bulunmuyor."));
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: requests.length,
          itemBuilder: (context, index) {
            final request = requests[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                  child: Text(request['fromName'][0]),
                ),
                title: Text(request['fromName']),
                subtitle: Text(request['fromShortId']),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.check_circle, color: Colors.green),
                      onPressed: () => FirestoreService().acceptFriendRequest(
                        request['id'],
                        request['fromId'],
                        currentUser.uid,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.cancel, color: Colors.red),
                      onPressed: () => FirestoreService().declineFriendRequest(request['id']),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildAddFriend() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Arkadaşınızın ID'si",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _searchController,
            onSubmitted: (val) => _performSearch(val),
            decoration: InputDecoration(
              hintText: "Örn: TMZ-1234",
              filled: true,
              fillColor: Colors.white,
              suffixIcon: IconButton(
                icon: const Icon(Icons.search),
                onPressed: () => _performSearch(_searchController.text),
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 24),
          if (_searchResult != null)
            _buildSearchResultCard(),
        ],
      ),
    );
  }

  Map<String, dynamic>? _searchResult;
  bool _isSearching = false;

  void _performSearch(String id) async {
    if (id.isEmpty) return;
    setState(() => _isSearching = true);
    
    final result = await FirestoreService().searchUserByShortId(id);
    
    setState(() {
      _searchResult = result;
      _isSearching = false;
    });

    if (result == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Kullanıcı bulunamadı."))
      );
    }
  }

  Widget _buildSearchResultCard() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
          child: Text(_searchResult!['name'][0]),
        ),
        title: Text(_searchResult!['name']),
        subtitle: Text(_searchResult!['shortId']),
        trailing: ElevatedButton(
          onPressed: () async {
            final currentUser = AuthService().currentUser;
            if (currentUser != null) {
              await FirestoreService().sendFriendRequest(
                currentUser.uid, 
                _searchResult!['id']
              );
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text("İstek Gönderildi!"))
              );
            }
          },
          child: const Text("Ekle"),
        ),
      ),
    );
  }
}
