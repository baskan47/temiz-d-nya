import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'models.dart';
import 'firestore_service.dart';
import 'theme.dart';
import 'neomorphic_components.dart';
import 'animation_utils.dart';

class AutonomousDeviceListScreen extends StatefulWidget {
  const AutonomousDeviceListScreen({Key? key}) : super(key: key);

  @override
  State<AutonomousDeviceListScreen> createState() => _AutonomousDeviceListScreenState();
}

class _AutonomousDeviceListScreenState extends State<AutonomousDeviceListScreen> {
  final FirestoreService _firestoreService = FirestoreService();
  AutonomousDevice? _selectedDevice;
  
  // Simulated User Location (center of Istanbul Kadikoy for testing)
  final double _simulatedUserLat = 40.9901;
  final double _simulatedUserLon = 29.0250;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Otonom Sıfır Atık Cihazları',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.playlist_add),
            tooltip: 'Simülasyon Verisi Yükle',
            onPressed: () => _showSeedDialog(context),
          ),
        ],
      ),
      body: SafeArea(
        child: OrientationBuilder(
          builder: (context, orientation) {
            final isLandscape = orientation == Orientation.landscape;

            return StreamBuilder<List<AutonomousDevice>>(
              stream: _firestoreService.watchAutonomousDevices(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Center(
                    child: AnimationUtils.loadingSpinner(color: AppTheme.primaryColor),
                  );
                }

                if (snapshot.hasError) {
                  return Center(
                    child: Text('Veri yüklenirken hata oluştu: ${snapshot.error}'),
                  );
                }

                final devices = snapshot.data ?? [];

                if (devices.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.sensors_off,
                            size: 80,
                            color: isDark ? Colors.grey[700] : Colors.grey[400],
                          ).animate().fade(duration: 500.ms).scale(),
                          const SizedBox(height: 16),
                          Text(
                            'Kayıtlı Otonom Cihaz Bulunamadı',
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Sistemi test etmek için simülasyon cihazları ekleyin.',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              color: isDark ? Colors.grey[400] : Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 24),
                          NeumorphicButton(
                            onPressed: () => _seedSimulationDevices(),
                            backgroundColor: isDark ? const Color(0xFF1E2937) : const Color(0xFFF1F5F9),
                            child: const Text('Simülasyon Cihazlarını Yükle'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                // If a device was previously selected, find its updated version
                if (_selectedDevice != null) {
                  try {
                    _selectedDevice = devices.firstWhere((d) => d.id == _selectedDevice!.id);
                  } catch (_) {
                    _selectedDevice = devices.first;
                  }
                } else {
                  _selectedDevice = devices.first;
                }

                if (isLandscape) {
                  // Yatay İki Panelli Düzen (Landscape Split-Screen)
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Sol Liste Paneli (%40 genişlik)
                      Expanded(
                        flex: 40,
                        child: Container(
                          decoration: BoxDecoration(
                            border: Border(
                              right: BorderSide(
                                color: isDark ? Colors.grey[800]! : Colors.grey[200]!,
                                width: 1,
                              ),
                            ),
                          ),
                          child: _buildDeviceList(devices, isDark),
                        ),
                      ),
                      // Sağ Detay Paneli (%60 genişlik)
                      Expanded(
                        flex: 60,
                        child: _selectedDevice != null
                            ? _buildDeviceDetails(_selectedDevice!, isDark)
                            : Center(
                                child: Text(
                                  'Detayları görüntülemek için sol taraftan bir cihaz seçin.',
                                  style: GoogleFonts.poppins(
                                    color: isDark ? Colors.grey[500] : Colors.grey[400],
                                  ),
                                ),
                              ),
                      ),
                    ],
                  );
                } else {
                  // Dikey Tek Panelli Düzen (Portrait view - fallback)
                  return Column(
                    children: [
                      Expanded(child: _buildDeviceList(devices, isDark)),
                      if (_selectedDevice != null)
                        Container(
                          height: 380,
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF111827) : Colors.white,
                            borderRadius: const BorderRadius.only(
                              topLeft: Radius.circular(24),
                              topRight: Radius.circular(24),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 10,
                                offset: const Offset(0, -4),
                              )
                            ],
                          ),
                          child: _buildDeviceDetails(_selectedDevice!, isDark),
                        ),
                    ],
                  );
                }
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildDeviceList(List<AutonomousDevice> devices, bool isDark) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: devices.length,
      itemBuilder: (context, index) {
        final device = devices[index];
        final isSelected = _selectedDevice?.id == device.id;

        // Calculate distance in meters using simple distance calculation (in real world uses Geolocator)
        final distance = _calculateDistance(
          _simulatedUserLat,
          _simulatedUserLon,
          device.latitude,
          device.longitude,
        );

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: NeumorphicCard(
            onTap: () {
              setState(() {
                _selectedDevice = device;
              });
            },
            borderRadius: 16.0,
            backgroundColor: isSelected
                ? (isDark ? const Color(0xFF1B3B2B) : const Color(0xFFE8F5E9))
                : (isDark ? const Color(0xFF1F2937) : Colors.white),
            shadows: isSelected
                ? [
                    BoxShadow(
                      color: AppTheme.primaryColor.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    )
                  ]
                : null,
            child: Row(
              children: [
                // Icon & Battery
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF374151) : const Color(0xFFF3F4F6),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.settings_input_hdmi,
                    color: _getStatusColor(device.status),
                  ),
                ),
                const SizedBox(width: 12),
                // Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        device.name,
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.location_on, size: 12, color: Colors.grey[400]),
                          const SizedBox(width: 2),
                          Text(
                            '${distance.toStringAsFixed(0)}m uzaklıkta',
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              color: Colors.grey[500],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(Icons.battery_std, size: 12, color: Colors.grey[400]),
                          Text(
                            '%${device.batteryLevel}',
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              color: Colors.grey[500],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Status Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(device.status).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _getStatusText(device.status),
                    style: GoogleFonts.poppins(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: _getStatusColor(device.status),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ).animate().fadeIn(delay: (50 * index).ms).slideX(begin: -0.1);
      },
    );
  }

  Widget _buildDeviceDetails(AutonomousDevice device, bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Device Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    device.name,
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Konum: ${device.latitude.toStringAsFixed(4)}, ${device.longitude.toStringAsFixed(4)}',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: Colors.grey[500],
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _getStatusColor(device.status).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _getStatusColor(device.status),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _getStatusText(device.status).toUpperCase(),
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: _getStatusColor(device.status),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 32),

          // Battery & Serviced details
          Row(
            children: [
              Expanded(
                child: NeumorphicCard(
                  padding: const EdgeInsets.all(12),
                  borderRadius: 12,
                  backgroundColor: isDark ? const Color(0xFF1F2937) : Colors.white,
                  child: Row(
                    children: [
                      Icon(Icons.battery_charging_full, color: Colors.green[400]),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Batarya Seviyesi', style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[500])),
                          Text('%${device.batteryLevel}', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: NeumorphicCard(
                  padding: const EdgeInsets.all(12),
                  borderRadius: 12,
                  backgroundColor: isDark ? const Color(0xFF1F2937) : Colors.white,
                  child: Row(
                    children: [
                      Icon(Icons.date_range, color: Colors.blue[400]),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Son Servis', style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[500])),
                            Text(
                              device.lastServiced != null
                                  ? '${device.lastServiced!.day}/${device.lastServiced!.month}/${device.lastServiced!.year}'
                                  : 'Servis Yok',
                              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Fill Rates (Doluluk Oranları) Title
          Text(
            'Atık Haznesi Doluluk Oranları',
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),

          // 2x2 Grid of Gauges
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.15,
            children: [
              _buildGaugeCard(
                title: 'Plastik',
                value: device.fillRates['plastic'] ?? 0.0,
                color: Colors.blue,
                icon: Icons.local_drink,
                isDark: isDark,
              ),
              _buildGaugeCard(
                title: 'Cam',
                value: device.fillRates['glass'] ?? 0.0,
                color: Colors.green,
                icon: Icons.hourglass_empty,
                isDark: isDark,
              ),
              _buildGaugeCard(
                title: 'Kağıt',
                value: device.fillRates['paper'] ?? 0.0,
                color: Colors.orange,
                icon: Icons.newspaper,
                isDark: isDark,
              ),
              _buildGaugeCard(
                title: 'Metal',
                value: device.fillRates['metal'] ?? 0.0,
                color: Colors.red,
                icon: Icons.view_headline,
                isDark: isDark,
              ),
            ],
          ),
          const SizedBox(height: 32),

          // Actions
          Row(
            children: [
              Expanded(
                child: NeumorphicButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('${device.name} konumuna yol tarifi başlatıldı.'),
                        backgroundColor: AppTheme.primaryColor,
                      ),
                    );
                  },
                  backgroundColor: isDark ? const Color(0xFF1F2937) : Colors.white,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.navigation_outlined, size: 18),
                      const SizedBox(width: 8),
                      Text('Yol Tarifi', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: NeumorphicButton(
                  onPressed: device.status == 'full' || device.status == 'offline'
                      ? null
                      : () => _showRecycleSimulationDialog(context, device),
                  backgroundColor: AppTheme.primaryColor,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.recycling, size: 18, color: Colors.white),
                      const SizedBox(width: 8),
                      Text(
                        'Atık Bırak',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ).animate().fadeIn(duration: 400.ms),
    );
  }

  Widget _buildGaugeCard({
    required String title,
    required double value,
    required Color color,
    required IconData icon,
    required bool isDark,
  }) {
    // Determine status warning
    Color progressColor = color;
    bool shouldFlash = false;
    if (value >= 90.0) {
      progressColor = Colors.redAccent;
      shouldFlash = true;
    } else if (value >= 75.0) {
      progressColor = Colors.orangeAccent;
    }

    Widget indicator = CircularProgressIndicator(
      value: value / 100.0,
      strokeWidth: 8,
      backgroundColor: isDark ? Colors.grey[800] : Colors.grey[200],
      valueColor: AlwaysStoppedAnimation<Color>(progressColor),
    );

    // Add flashing animation if full
    if (shouldFlash) {
      indicator = indicator
          .animate(onPlay: (controller) => controller.repeat(reverse: true))
          .custom(
            duration: 800.ms,
            builder: (context, val, child) => Opacity(
              opacity: 0.4 + (val * 0.6),
              child: child,
            ),
          );
    }

    return NeumorphicCard(
      padding: const EdgeInsets.all(12),
      borderRadius: 16,
      backgroundColor: isDark ? const Color(0xFF1F2937) : Colors.white,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, size: 16, color: color),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.grey[300] : Colors.grey[700],
                ),
              ),
              const SizedBox(width: 16),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 70,
                  height: 70,
                  child: indicator,
                ),
                Text(
                  '%${value.toStringAsFixed(0)}',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active':
        return AppTheme.successColor;
      case 'full':
        return AppTheme.errorColor;
      case 'maintenance':
        return AppTheme.warningColor;
      case 'offline':
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'full':
        return 'Dolu';
      case 'maintenance':
        return 'Bakımda';
      case 'offline':
      default:
        return 'Çevrimdışı';
    }
  }

  double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    // Simple distance calculation in meters for visualization
    const r = 6371000; // Earth radius in meters
    final dLat = (lat2 - lat1) * pi / 180;
    final dLon = (lon2 - lon1) * pi / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * pi / 180) * cos(lat2 * pi / 180) *
        sin(dLon / 2) * sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return r * c;
  }

  // Seed simulated data directly into Firestore
  Future<void> _seedSimulationDevices() async {
    final firestore = FirebaseFirestore.instance;
    final batch = firestore.batch();

    final List<Map<String, dynamic>> mockDevices = [
      {
        'device_name': 'Smart-Bin Kadıköy A1',
        'status': 'active',
        'location': {
          'latitude': 40.9902, // Near simulated user (10 meters)
          'longitude': 29.0251,
        },
        'battery_level': 92,
        'fill_rates': {
          'plastic': 45.0,
          'glass': 20.0,
          'paper': 65.0,
          'metal': 10.0,
        },
        'last_serviced': Timestamp.now(),
        'created_at': Timestamp.now(),
      },
      {
        'device_name': 'Smart-Bin Beşiktaş B3',
        'status': 'active',
        'location': {
          'latitude': 41.0420, // Far away (Besiktas)
          'longitude': 29.0075,
        },
        'battery_level': 85,
        'fill_rates': {
          'plastic': 88.0,
          'glass': 92.0,
          'paper': 30.0,
          'metal': 75.0,
        },
        'last_serviced': Timestamp.now(),
        'created_at': Timestamp.now(),
      },
      {
        'device_name': 'Smart-Bin Üsküdar C2',
        'status': 'maintenance',
        'location': {
          'latitude': 41.0267,
          'longitude': 29.0156,
        },
        'battery_level': 12,
        'fill_rates': {
          'plastic': 10.0,
          'glass': 5.0,
          'paper': 15.0,
          'metal': 2.0,
        },
        'last_serviced': Timestamp.now(),
        'created_at': Timestamp.now(),
      },
    ];

    for (var deviceData in mockDevices) {
      final docRef = firestore.collection('autonomous_devices').doc();
      batch.set(docRef, deviceData);
    }

    // Seed some rewards catalog mock data too if empty
    final rewardDocs = await firestore.collection('rewards_catalog').limit(1).get();
    if (rewardDocs.docs.isEmpty) {
      final List<Map<String, dynamic>> mockRewards = [
        {
          'title': 'Eco Bez Çanta',
          'description': 'Geri dönüştürülmüş malzemeden üretilen, Sıfır Atık logolu şık bez çanta.',
          'points_cost': 150,
          'image_url': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500',
          'provider': 'Temiz Dünya Vakfı',
          'stock': 100,
          'is_active': true,
          'created_at': Timestamp.now(),
        },
        {
          'title': 'Paslanmaz Çelik Matara',
          'description': 'Plastik kullanımını önleyen, 500ml kapasiteli, çift cidarlı çelik termos matara.',
          'points_cost': 500,
          'image_url': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
          'provider': 'EcoMatara Inc.',
          'stock': 50,
          'is_active': true,
          'created_at': Timestamp.now(),
        },
        {
          'title': '1 Ay Sınırsız Metro Kartı',
          'description': 'Toplu taşımayı teşvik eden 1 aylık ücretsiz İstanbulkart abonmanı.',
          'points_cost': 1200,
          'image_url': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500',
          'provider': 'İstanbul Büyükşehir Belediyesi',
          'stock': 10,
          'is_active': true,
          'created_at': Timestamp.now(),
        },
      ];
      for (var rewardData in mockRewards) {
        final docRef = firestore.collection('rewards_catalog').doc();
        batch.set(docRef, rewardData);
      }
    }

    await batch.commit();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Simülasyon verileri başarıyla yüklendi.'),
          backgroundColor: AppTheme.successColor,
        ),
      );
    }
  }

  void _showSeedDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Simülasyon Verisi Yükle'),
        content: const Text(
          'Veritabanınız boşsa test etmek için otonom cihazlar ve market ürünleri ekleyebilirsiniz.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _seedSimulationDevices();
            },
            child: const Text('Yükle'),
          ),
        ],
      ),
    );
  }

  // Opens Dialog to simulate dropping waste
  void _showRecycleSimulationDialog(BuildContext context, AutonomousDevice device) {
    double plasticKg = 1.0;
    double glassKg = 0.0;
    double paperKg = 0.0;
    double metalKg = 0.0;
    bool simulateSpoofing = false;
    bool isLoading = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Row(
                children: [
                  const Icon(Icons.recycling, color: AppTheme.primaryColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Atık Bırakma Simülatörü',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ),
                ],
              ),
              content: isLoading
                  ? Container(
                      height: 200,
                      alignment: Alignment.center,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          AnimationUtils.loadingSpinner(color: AppTheme.primaryColor),
                          const SizedBox(height: 16),
                          Text(
                            'Güvenlik ve Konum Doğrulaması Yapılıyor...',
                            style: GoogleFonts.poppins(fontSize: 12),
                          ),
                        ],
                      ),
                    )
                  : SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            device.name,
                            style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey),
                          ),
                          const SizedBox(height: 16),
                          
                          // Waste Weights sliders
                          _buildWasteSlider(
                            label: 'Plastik (kg)',
                            value: plasticKg,
                            color: Colors.blue,
                            onChanged: (val) => setDialogState(() => plasticKg = val),
                          ),
                          _buildWasteSlider(
                            label: 'Cam (kg)',
                            value: glassKg,
                            color: Colors.green,
                            onChanged: (val) => setDialogState(() => glassKg = val),
                          ),
                          _buildWasteSlider(
                            label: 'Kağıt (kg)',
                            value: paperKg,
                            color: Colors.orange,
                            onChanged: (val) => setDialogState(() => paperKg = val),
                          ),
                          _buildWasteSlider(
                            label: 'Metal (kg)',
                            value: metalKg,
                            color: Colors.red,
                            onChanged: (val) => setDialogState(() => metalKg = val),
                          ),

                          const Divider(height: 24),

                          // Location Simulation Option
                          Text(
                            'Simüle Edilen Konum (50 Metre Güvenlik Çemberi)',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 8),

                          Column(
                            children: [
                              RadioListTile<bool>(
                                title: Text(
                                  'Cihazın Yanında (10 metre mesafe)',
                                  style: GoogleFonts.poppins(fontSize: 12),
                                ),
                                subtitle: Text(
                                  'Güvenli alan. İşlem onaylanır, puan kazandırır.',
                                  style: GoogleFonts.poppins(fontSize: 10, color: Colors.green),
                                ),
                                value: false,
                                groupValue: simulateSpoofing,
                                activeColor: AppTheme.primaryColor,
                                onChanged: (val) {
                                  if (val != null) {
                                    setDialogState(() => simulateSpoofing = val);
                                  }
                                },
                              ),
                              RadioListTile<bool>(
                                title: Text(
                                  'Cihazdan Uzakta (500 metre - Hile Testi)',
                                  style: GoogleFonts.poppins(fontSize: 12, color: Colors.red),
                                ),
                                subtitle: Text(
                                  'Hile girişimi! İşlem reddedilir, güven skorundan 15 puan düşer.',
                                  style: GoogleFonts.poppins(fontSize: 10, color: Colors.red),
                                ),
                                value: true,
                                groupValue: simulateSpoofing,
                                activeColor: Colors.red,
                                onChanged: (val) {
                                  if (val != null) {
                                    setDialogState(() => simulateSpoofing = val);
                                  }
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
              actions: isLoading
                  ? []
                  : [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('İptal'),
                      ),
                      ElevatedButton(
                        onPressed: () async {
                          setDialogState(() => isLoading = true);

                          // Calculate coordinates based on simulation choice
                          double userLat = device.latitude;
                          double userLon = device.longitude;

                          if (simulateSpoofing) {
                            // Add 0.005 degrees (approx 550 meters)
                            userLat += 0.005;
                            userLon += 0.005;
                          } else {
                            // Add a micro offset (approx 10 meters)
                            userLat += 0.00008;
                            userLon += 0.00008;
                          }

                          try {
                            // Submit to database service
                            await _firestoreService.recordRecycleTransaction(
                              userId: 'TEST_USER_AURA_1', // Using simulated user ID
                              deviceId: device.id,
                              plastic: plasticKg,
                              glass: glassKg,
                              paper: paperKg,
                              metal: metalKg,
                              organic: 0.0,
                              userLat: userLat,
                              userLon: userLon,
                            );

                            if (mounted) {
                              Navigator.pop(context); // Close simulation dialog
                              _showSuccessFeedback(context, plasticKg, glassKg, paperKg, metalKg);
                            }
                          } catch (e) {
                            if (mounted) {
                              Navigator.pop(context); // Close simulation dialog
                              _showFailureFeedback(context, e.toString());
                            }
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: simulateSpoofing ? Colors.red : AppTheme.primaryColor,
                        ),
                        child: Text(
                          simulateSpoofing ? 'Hile Testini Çalıştır' : 'Atığı Bırak',
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                    ],
            );
          },
        );
      },
    );
  }

  Widget _buildWasteSlider({
    required String label,
    required double value,
    required Color color,
    required ValueChanged<double> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: GoogleFonts.poppins(fontSize: 12)),
            Text(
              '${value.toStringAsFixed(1)} kg',
              style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: color, fontSize: 12),
            ),
          ],
        ),
        Slider(
          value: value,
          min: 0.0,
          max: 10.0,
          divisions: 20,
          activeColor: color,
          inactiveColor: color.withOpacity(0.15),
          onChanged: onChanged,
        ),
      ],
    );
  }

  void _showSuccessFeedback(BuildContext context, double p, double g, double pa, double m) {
    // Calculate simulated score
    final score = (p * 1.5 + g * 1.2 + pa * 1.0 + m * 1.8) * 1.1;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimationUtils.successCheckmark(size: 80),
            const SizedBox(height: 16),
            Text(
              'Geri Dönüşüm Başarılı!',
              style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green),
            ),
            const SizedBox(height: 8),
            Text(
              'Konumunuz doğrulandı ve atıklarınız otonom sisteme teslim edildi.',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(fontSize: 12),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.star, color: Colors.amber),
                  const SizedBox(width: 8),
                  Text(
                    '+${score.toStringAsFixed(1)} Eco-Puan',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.amber[800]),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
            child: const Text('Harika!', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showFailureFeedback(BuildContext context, String errorMessage) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimationUtils.errorMark(size: 80),
            const SizedBox(height: 16),
            Text(
              'İşlem Reddedildi!',
              style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.red),
            ),
            const SizedBox(height: 8),
            Text(
              errorMessage.contains('SPOOFING_DETECTED')
                  ? 'HİLE TESPİT EDİLDİ:\nCihaza 50 metreden daha uzaktasınız. Güvenliğiniz ve sistem bütünlüğü için Güven Skorunuzdan 15 puan düşürülmüştür.'
                  : errorMessage,
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(fontSize: 12, color: Colors.red[800]),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Kapat', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
