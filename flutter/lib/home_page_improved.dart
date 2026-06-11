import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'firestore_service.dart';
import 'dirty_areas_map_screen.dart';
import 'camera_screen.dart';
import 'location_service.dart';
import 'theme.dart';
import 'language_provider.dart';
import 'neomorphic_components.dart';
import 'dart:ui';

class HomePageImproved extends StatefulWidget {
  @override
  _HomePageImprovedState createState() => _HomePageImprovedState();
}

class _HomePageImprovedState extends State<HomePageImproved> {
  static final LatLng _alanya = LatLng(36.5437, 31.9998);
  final _mapController = MapController();
  LatLng? _userLocation;
  final LocationService _locationService = LocationService();
  
  bool _isMissionActive = false;
  String _activeFilter = 'Hepsi';

  // Enhanced Mock Data for the Map Center
  final List<EnhancedMarkerData> _allMarkers = [
    EnhancedMarkerData(
      point: LatLng(36.5439, 31.9995), 
      type: 'Temiz', 
      title: 'Damlataş Plajı',
      description: 'Dün akşam Alanya Gönüllüleri tarafından tamamen temizlendi.',
      images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e', 'https://images.unsplash.com/photo-1519046904884-53103b34b206'],
      comments: [{'user': 'Baran', 'comment': 'Hala çok temiz gözüküyor!'}, {'user': 'Merve', 'comment': 'Harika bir çalışma oldu.'}],
      color: Colors.green
    ),
    EnhancedMarkerData(
      point: LatLng(36.5445, 32.0002), 
      type: 'Kirli', 
      title: 'İskele Meydanı Arkası',
      description: 'Büyük miktarda plastik ve cam atık tespit edildi.',
      images: ['https://images.unsplash.com/photo-1530587191325-3db32d826c18'],
      comments: [{'user': 'Can', 'comment': 'Buraya acil ekip lazım.'}],
      color: Colors.red
    ),
    EnhancedMarkerData(
      point: LatLng(36.5430, 32.0010), 
      type: 'Görev', 
      title: 'Haftalık Büyük Temizlik',
      description: 'Tüm sahil şeridini el birliğiyle temizliyoruz.',
      reward: '500 EP',
      target: '500 kg Atık',
      requirements: 'Eldiven ve Çöp Poşeti Zorunludur.',
      color: Colors.blue
    ),
    EnhancedMarkerData(
      point: LatLng(36.5425, 31.9990), 
      type: 'Grup', 
      title: 'Yeşil Gelecek Grubu',
      description: 'Liman bölgesinde aktif temizlik yapıyorlar.',
      membersCount: 12,
      progress: 0.65,
      color: Colors.orange
    ),
  ];

  @override
  void initState() {
    super.initState();
    _fetchUserLocation();
  }

  void _fetchUserLocation() async {
    final loc = await _locationService.getCurrentLocation();
    if (loc != null && mounted) {
      setState(() => _userLocation = loc);
      _mapController.move(loc, 15.0);
    }
  }



  List<Marker> _getMarkers() {
    return _allMarkers
        .where((m) => _activeFilter == 'Hepsi' || m.type == _activeFilter)
        .map((m) => Marker(
              point: m.point,
              width: 45,
              height: 45,
              child: GestureDetector(
                onTap: () => _showPinDetails(m),
                child: Icon(Icons.location_on, color: m.color, size: 40)
                    .animate(onPlay: (c) => m.type == 'Kirli' || m.type == 'Grup' ? c.repeat() : null)
                    .scale(begin: const Offset(0.9, 0.9), end: const Offset(1.1, 1.1), duration: 1.seconds, curve: Curves.easeInOut)
                    .fadeIn(duration: 500.ms),
              ),
            ))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // 🗺️ CUSTOM MINIMALIST MAP
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(initialCenter: _alanya, initialZoom: 15.0),
            children: [
              TileLayer(
                urlTemplate: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', // A slightly cleaner style
                userAgentPackageName: 'com.purdunya.app',
              ),
              StreamBuilder<List<Map<String, dynamic>>>(
                stream: Provider.of<FirestoreService>(context, listen: false).watchIncomingReports(),
                builder: (context, snapshot) {
                  final reports = snapshot.data ?? [];
                  final firestoreMarkers = reports.map((r) {
                    final loc = r['location'];
                    final m = EnhancedMarkerData(
                      point: LatLng(loc['latitude'], loc['longitude']),
                      type: 'Kirli',
                      title: 'Kullanıcı Bildirimi',
                      description: r['description'] ?? 'Topluluk tarafından bildirilmiş kirli alan.',
                      color: Colors.red,
                    );
                    
                    if (_activeFilter != 'Hepsi' && m.type != _activeFilter) return null;

                    return Marker(
                      point: m.point,
                      width: 45,
                      height: 45,
                      child: GestureDetector(
                        onTap: () => _showPinDetails(m),
                        child: Icon(Icons.location_on, color: m.color, size: 40)
                            .animate(onPlay: (c) => c.repeat())
                            .scale(begin: const Offset(0.9, 0.9), end: const Offset(1.1, 1.1), duration: 1.seconds, curve: Curves.easeInOut)
                            .fadeIn(duration: 500.ms),
                      ),
                    );
                  }).whereType<Marker>().toList();

                  return MarkerLayer(
                    markers: [
                      if (_userLocation != null)
                        Marker(
                          point: _userLocation!,
                          width: 50,
                          height: 50,
                          child: const Icon(Icons.my_location, color: Colors.blue, size: 30),
                        ),
                      ..._getMarkers(),
                      ...firestoreMarkers,
                    ],
                  );
                }
              ),
            ],
          ),

          // 🏷️ LEGEND PANEL (Top Left)
          Positioned(
            top: 60,
            left: 20,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.8),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.5)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildLegendItem(Colors.green, context.watch<LanguageProvider>().translate('clean')),
                      _buildLegendItem(Colors.red, context.watch<LanguageProvider>().translate('dirty')),
                      _buildLegendItem(Colors.blue, context.watch<LanguageProvider>().translate('mission')),
                      _buildLegendItem(Colors.orange, context.watch<LanguageProvider>().translate('group')),
                    ],
                  ),
                ),
              ),
            ),
          ).animate().fadeIn().slideX(begin: -0.2),

          // 🚀 QUICK ACTION BUTTON (Bottom Right)
          Positioned(
            bottom: 110,
            right: 20,
            child: Column(
              children: [
                _buildCircularMapAction(Icons.my_location, Colors.white, Colors.blue, () {
                  if (_userLocation != null) _mapController.move(_userLocation!, 15);
                }),
                const SizedBox(height: 12),
                _buildCircularMapAction(Icons.add_a_photo, Colors.white, Colors.green, () {
                  _showCameraActionSheet(context);
                }),
              ],
            ),
          ),

          // 🔍 MODERN FILTER BAR (Bottom Center)
          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(25),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(25),
                    border: Border.all(color: Colors.white.withOpacity(0.4)),
                  ),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildModernFilter("Hepsi", Colors.grey[800]!, context.watch<LanguageProvider>().translate('all')),
                        _buildModernFilter("Kirli", Colors.red, context.watch<LanguageProvider>().translate('dirty')),
                        _buildModernFilter("Temiz", Colors.green, context.watch<LanguageProvider>().translate('clean')),
                        _buildModernFilter("Görev", Colors.blue, context.watch<LanguageProvider>().translate('mission')),
                        _buildModernFilter("Grup", Colors.orange, context.watch<LanguageProvider>().translate('group')),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ).animate().fadeIn().slideY(begin: 0.2),
        ],
      ),
    );
  }

  Widget _buildCircularMapAction(IconData icon, Color bg, Color iconColor, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: bg,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(color: iconColor.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 8)),
          ],
        ),
        child: Icon(icon, color: iconColor),
      ),
    );
  }

  Widget _buildModernFilter(String filterKey, Color color, String translatedLabel) {
    bool isSelected = _activeFilter == filterKey;
    return GestureDetector(
      onTap: () => setState(() => _activeFilter = filterKey),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          boxShadow: isSelected ? [BoxShadow(color: color.withOpacity(0.4), blurRadius: 12, spreadRadius: 2)] : null,
        ),
        child: Text(
          translatedLabel,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : Colors.grey[700],
          ),
        ),
      ),
    );
  }

  void _showPinDetails(EnhancedMarkerData data) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.4,
        minChildSize: 0.4,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(topLeft: Radius.circular(30), topRight: Radius.circular(30)),
          ),
          child: ListView(
            controller: scrollController,
            padding: EdgeInsets.zero,
            children: [
              // Pull Handle
              const SizedBox(height: 12),
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 20),

              // Dynamic Content based on type
              if (data.type == 'Temiz' || data.type == 'Kirli') _buildAreaPanel(data),
              if (data.type == 'Görev') _buildTaskPanel(data),
              if (data.type == 'Grup') _buildGroupPanel(data),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAreaPanel(EnhancedMarkerData data) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image Carousel Placeholder
          Container(
            height: 200,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(20),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Image.network(data.images!.first, fit: BoxFit.cover),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(data.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(data.type == 'Temiz' ? "✅ ${context.watch<LanguageProvider>().translate('fully_cleaned')}" : "⚠️ ${context.watch<LanguageProvider>().translate('pollution_reported')}", 
                      style: TextStyle(color: data.color, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              if (data.type == 'Temiz') 
                ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.favorite, size: 16),
                  label: Text(context.watch<LanguageProvider>().translate('thank_you')),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.pink[50], foregroundColor: Colors.pink),
                ),
            ],
          ),
          const SizedBox(height: 15),
          Text(data.description, style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 25),
          Text(context.watch<LanguageProvider>().translate('user_comments'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 10),
          ...data.comments!.map((c) => ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(child: Text(c['user']![0])),
            title: Text(c['user']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            subtitle: Text(c['comment']!, style: const TextStyle(fontSize: 12)),
          )),
          const SizedBox(height: 30),
          if (data.type == 'Kirli')
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
                onPressed: () => Navigator.pop(context),
                child: Text(context.watch<LanguageProvider>().translate('go_to_clean'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildTaskPanel(EnhancedMarkerData data) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(20)),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(context.watch<LanguageProvider>().translate('mission_reward'), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
                Text(data.reward!, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.blue)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(data.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 15),
          _buildTaskInfo(Icons.flag_rounded, "${context.watch<LanguageProvider>().translate('target')}: ${data.target}"),
          _buildTaskInfo(Icons.rule_rounded, "${context.watch<LanguageProvider>().translate('requirement')}: ${data.requirements}"),
          const SizedBox(height: 20),
          Text(data.description, style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 40),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
              onPressed: () => Navigator.pop(context),
              child: Text(context.watch<LanguageProvider>().translate('accept_mission'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGroupPanel(EnhancedMarkerData data) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(data.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: Colors.orange[50], borderRadius: BorderRadius.circular(10)),
                child: Text("${data.membersCount} ${context.watch<LanguageProvider>().translate('people_working')}", style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text("${context.watch<LanguageProvider>().translate('cleaning_progress')}: %${(data.progress! * 100).toInt()}", style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(value: data.progress, minHeight: 12, color: Colors.orange, backgroundColor: Colors.orange[100]),
          ),
          const SizedBox(height: 30),
          Text(context.watch<LanguageProvider>().translate('live_stream'), style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: 5,
              itemBuilder: (context, index) => Container(
                width: 100,
                margin: const EdgeInsets.only(right: 12),
                decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(15)),
                child: const Icon(Icons.image, color: Colors.grey),
              ),
            ),
          ),
          const SizedBox(height: 40),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(context.read<LanguageProvider>().translate('connecting_to_chat')),
                        action: SnackBarAction(label: context.read<LanguageProvider>().translate('open'), onPressed: () {}),
                      ),
                    );
                  },
                  icon: const Icon(Icons.message),
                  label: Text(context.watch<LanguageProvider>().translate('message_to_group')),
                  style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    _mapController.move(data.point, 18);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text("${data.title} ${context.read<LanguageProvider>().translate('directions_started')}"),
                        backgroundColor: Colors.orange,
                      ),
                    );
                  },
                  icon: const Icon(Icons.directions),
                  label: Text(context.watch<LanguageProvider>().translate('directions')),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTaskInfo(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.blue),
          const SizedBox(width: 10),
          Text(text, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  void _showCameraActionSheet(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withOpacity(0.5),
      builder: (context) => ClipRRect(
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(30),
          topRight: Radius.circular(30),
        ),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.9),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(30),
                topRight: Radius.circular(30),
              ),
              border: Border.all(color: Colors.white.withOpacity(0.3)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  context.watch<LanguageProvider>().translate('camera_actions'),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 24),
                _buildActionSheetOption(
                  context,
                  icon: Icons.add_location_alt_rounded,
                  title: context.watch<LanguageProvider>().translate('report_pollution'),
                  subtitle: context.watch<LanguageProvider>().translate('report_dirty_area_desc'),
                  color: Colors.orange,
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const DirtyAreasMapScreen(startReporting: true),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 16),
                _buildActionSheetOption(
                  context,
                  icon: Icons.check_circle_rounded,
                  title: context.watch<LanguageProvider>().translate('cleaning_completed'),
                  subtitle: context.watch<LanguageProvider>().translate('save_cleanup_desc'),
                  color: Colors.green,
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => CameraScreen(
                          operationId: 'op-1',
                          userId: user?.uid ?? 'anonymous',
                          groupId: 'group-1',
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionSheetOption(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.8),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }
}

class EnhancedMarkerData {
  final LatLng point;
  final String type;
  final Color color;
  final String title;
  final String description;
  final List<String>? images;
  final List<Map<String, String>>? comments;
  final String? reward;
  final String? target;
  final String? requirements;
  final int? membersCount;
  final double? progress;

  EnhancedMarkerData({
    required this.point, 
    required this.type, 
    required this.color,
    required this.title,
    required this.description,
    this.images,
    this.comments,
    this.reward,
    this.target,
    this.requirements,
    this.membersCount,
    this.progress,
  });
}
