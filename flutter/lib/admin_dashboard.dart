import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_map_marker_cluster/flutter_map_marker_cluster.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'firestore_service.dart';
import 'dart:ui';

/// SAAS-GRADE ADMIN THEME
class AdminTheme {
  static const Color primary = Color(0xFF00E676);
  static const Color secondary = Color(0xFF00E5FF);
  static const Color bgDark = Color(0xFF0F172A);
  static const Color surface = Color(0xFF1E293B);
  static const Color textMain = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color danger = Color(0xFFFF5252);
  
  static BoxDecoration glass = BoxDecoration(
    color: Colors.white.withOpacity(0.05),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: Colors.white.withOpacity(0.1)),
  );
}

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({Key? key}) : super(key: key);

  @override
  _AdminDashboardScreenState createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> with TickerProviderStateMixin {
  int _activeMenuIndex = 0;
  bool _isSidebarCollapsed = false;
  final FirestoreService _firestoreService = FirestoreService();

  Map<String, dynamic> _stats = {
    'totalWaste': 0.0,
    'activeVolunteers': 0,
    'riskyZones': 0,
    'aiAccuracy': 98.4,
  };

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final stats = await _firestoreService.getAdminStats();
    if (mounted) setState(() => _stats = stats);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AdminTheme.bgDark,
      body: Row(
        children: [
          _buildSidebar(),
          Expanded(
            child: Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    child: _buildCurrentPage(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentPage() {
    switch (_activeMenuIndex) {
      case 0: return _buildOverviewPage();
      case 1: return _buildMapPage();
      case 2: return _buildAIPage();
      case 3: return _buildGroupsPage();
      case 4: return _buildSettingsPage();
      default: return _buildOverviewPage();
    }
  }

  Widget _buildSidebar() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: _isSidebarCollapsed ? 80 : 260,
      color: AdminTheme.surface,
      child: Column(
        children: [
          const SizedBox(height: 40),
          _buildLogo(),
          const SizedBox(height: 40),
          _sidebarNavItem(0, Icons.dashboard_rounded, "Genel Bakış"),
          _sidebarNavItem(1, Icons.map_rounded, "Kirlilik Haritası"),
          _sidebarNavItem(2, Icons.auto_awesome_rounded, "AI Doğrulama"),
          _sidebarNavItem(3, Icons.groups_rounded, "Grup Metrikleri"),
          _sidebarNavItem(4, Icons.settings_rounded, "Sistem Ayarları"),
          const Spacer(),
          _buildAdminProfile(),
        ],
      ),
    );
  }

  Widget _sidebarNavItem(int index, IconData icon, String label) {
    bool isActive = _activeMenuIndex == index;
    return ListTile(
      onTap: () => setState(() => _activeMenuIndex = index),
      leading: Icon(icon, color: isActive ? AdminTheme.primary : AdminTheme.textMuted),
      title: _isSidebarCollapsed ? null : Text(label, style: TextStyle(color: isActive ? Colors.white : AdminTheme.textMuted, fontWeight: isActive ? FontWeight.bold : FontWeight.normal)),
      selected: isActive,
      selectedTileColor: AdminTheme.primary.withOpacity(0.05),
    );
  }

  Widget _buildOverviewPage() {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildStatsSection(),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(flex: 2, child: _buildMapSection()),
              const SizedBox(width: 24),
              Expanded(flex: 1, child: _buildChartSection()),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(child: _buildVerificationQueue()),
              const SizedBox(width: 24),
              Expanded(child: _buildLeaderboard()),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatsSection() {
    return Row(
      children: [
        _statCard("Toplam Atık (Ton)", "${_stats['totalWaste'].toStringAsFixed(1)}", AdminTheme.primary),
        _statCard("Gönüllü", "${_stats['activeVolunteers']}", AdminTheme.secondary),
        _statCard("Riskli Bölge", "${_stats['riskyZones']}", AdminTheme.danger),
        _statCard("AI Başarı", "%${_stats['aiAccuracy']}", Colors.white),
      ],
    );
  }

  Widget _statCard(String label, String value, Color color) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.only(right: 16),
        padding: const EdgeInsets.all(24),
        decoration: AdminTheme.glass,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: AdminTheme.textMuted, fontSize: 13)),
            const SizedBox(height: 12),
            Text(value, style: TextStyle(color: color, fontSize: 28, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildMapSection() {
    return Container(
      height: 400,
      decoration: AdminTheme.glass,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: FlutterMap(
          options: const MapOptions(initialCenter: LatLng(39.9207, 32.8541), initialZoom: 6),
          children: [
            TileLayer(urlTemplate: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', subdomains: const ['a', 'b', 'c']),
          ],
        ),
      ),
    );
  }

  Widget _buildChartSection() {
    return Container(
      height: 400,
      padding: const EdgeInsets.all(24),
      decoration: AdminTheme.glass,
      child: LineChart(LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        lineBarsData: [LineChartBarData(spots: const [FlSpot(0, 1), FlSpot(1, 3), FlSpot(2, 2), FlSpot(3, 5)], isCurved: true, color: AdminTheme.primary, barWidth: 4)],
      )),
    );
  }

  Widget _buildVerificationQueue() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: AdminTheme.glass,
      child: StreamBuilder<List<Map<String, dynamic>>>(
        stream: _firestoreService.watchAdminVerificationQueue(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final items = snapshot.data!;
          return Column(
            children: items.take(4).map((item) => ListTile(
              title: Text(item['district'] ?? "Bölge", style: const TextStyle(color: Colors.white)),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(icon: const Icon(Icons.close, color: AdminTheme.danger), onPressed: () => _firestoreService.processAdminDecision(item['id'], false)),
                  IconButton(icon: const Icon(Icons.check, color: AdminTheme.primary), onPressed: () => _firestoreService.processAdminDecision(item['id'], true)),
                ],
              ),
            )).toList(),
          );
        },
      ),
    );
  }

  Widget _buildLeaderboard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: AdminTheme.glass,
      child: StreamBuilder<List<Map<String, dynamic>>>(
        stream: _firestoreService.watchGroupLeaderboard(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final items = snapshot.data!;
          return Column(
            children: items.take(4).map((item) => ListTile(
              title: Text(item['name'] ?? "Grup", style: const TextStyle(color: Colors.white)),
              subtitle: Text("İlerleme: %${((item['progressValue'] ?? 0) * 100).toInt()}", style: const TextStyle(color: AdminTheme.textMuted)),
            )).toList(),
          );
        },
      ),
    );
  }

  Widget _buildHeader() => Container(height: 70, padding: const EdgeInsets.symmetric(horizontal: 24), decoration: BoxDecoration(color: AdminTheme.surface, border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05)))), child: const Row(children: [Text("COMMAND CENTER v3.0", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)), Spacer(), Icon(Icons.notifications, color: AdminTheme.textMuted)]));
  Widget _buildLogo() => const Padding(padding: EdgeInsets.all(16), child: Text("TEMİZ DÜNYA", style: TextStyle(color: AdminTheme.primary, fontWeight: FontWeight.bold, letterSpacing: 2)));
  Widget _buildAdminProfile() => Container(padding: const EdgeInsets.all(16), child: const Row(children: [CircleAvatar(radius: 16), SizedBox(width: 12), Text("Admin", style: TextStyle(color: Colors.white))]));
  Widget _buildMapPage() => const Center(child: Text("Harita Detay", style: TextStyle(color: Colors.white)));
  Widget _buildAIPage() => const Center(child: Text("AI Paneli", style: TextStyle(color: Colors.white)));
  Widget _buildGroupsPage() => const Center(child: Text("Gruplar", style: TextStyle(color: Colors.white)));
  Widget _buildSettingsPage() => const Center(child: Text("Ayarlar", style: TextStyle(color: Colors.white)));
}
