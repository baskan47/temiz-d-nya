import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:typed_data';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:geolocator/geolocator.dart';
import 'theme.dart';
import 'image_analysis_service.dart';
import 'analysis_result_sheet.dart';
import 'firestore_service.dart';
import 'report_detail_screen.dart';

class DirtyAreasMapScreen extends StatefulWidget {
  final bool startReporting;

  const DirtyAreasMapScreen({Key? key, this.startReporting = false}) : super(key: key);

  @override
  _DirtyAreasMapScreenState createState() => _DirtyAreasMapScreenState();
}

class _DirtyAreasMapScreenState extends State<DirtyAreasMapScreen> {
  final MapController _mapController = MapController();
  List<Marker> _markers = [];
  final _picker = ImagePicker();
  final _analysisService = ImageAnalysisService();
  bool _isAnalyzing = false;

  bool _isSelectingLocationMode = false;
  LatLng? _selectedLocation;
  List<Uint8List> _imagesBytes = [];
  bool _isUploading = false;
  final TextEditingController _descriptionController = TextEditingController();

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _loadMockMarkers();
    if (widget.startReporting) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _startReportProcess();
      });
    }
  }

  void _loadMockMarkers() {
    setState(() {
      _markers = [
        Marker(
          point: LatLng(36.5444, 31.9954), // Alanya example
          width: 40,
          height: 40,
          child: const Icon(Icons.location_on, color: Colors.red, size: 40),
        ),
        Marker(
          point: LatLng(36.5500, 32.0100),
          width: 40,
          height: 40,
          child: const Icon(Icons.location_on, color: Colors.orange, size: 40),
        ),
      ];
    });
  }

  @override
  Widget build(BuildContext context) {
    final firestoreService = Provider.of<FirestoreService>(context, listen: false);

    return Scaffold(
      body: Stack(
        children: [
          StreamBuilder<List<Map<String, dynamic>>>(
            stream: firestoreService.watchIncomingReports(),
            builder: (context, snapshot) {
              final reports = snapshot.data ?? [];
              final reportMarkers = reports.map((r) {
                final double lat = (r['latitude'] ?? r['location']?['latitude'] ?? 36.5444).toDouble();
                final double lon = (r['longitude'] ?? r['location']?['longitude'] ?? 31.9954).toDouble();
                final status = r['status'] ?? 'dirty';
                
                Color markerColor;
                IconData markerIcon;
                switch (status) {
                  case 'cleaned':
                    markerColor = Colors.green;
                    markerIcon = Icons.check;
                    break;
                  case 'cleaning':
                  case 'in_progress':
                    markerColor = Colors.orange;
                    markerIcon = Icons.engineering_outlined;
                    break;
                  default: // dirty veya open
                    markerColor = Colors.red;
                    markerIcon = Icons.delete_outline;
                }

                return Marker(
                  point: LatLng(lat, lon),
                  width: 45,
                  height: 45,
                  child: GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ReportDetailScreen(report: r),
                        ),
                      );
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: markerColor,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.25), blurRadius: 4, offset: const Offset(0, 2))
                        ],
                      ),
                      padding: const EdgeInsets.all(6),
                      child: Icon(
                        markerIcon,
                        color: Colors.white,
                        size: 20,
                      ),
                    ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 3.seconds),
                  ),
                );
              }).toList();

              return FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: LatLng(36.5444, 31.9954),
                  initialZoom: 13.0,
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.example.app',
                  ),
                  MarkerLayer(markers: [..._markers, ...reportMarkers]),
                ],
              );
            }
          ),
          
          // Back Button
          Positioned(
            top: 50,
            left: 20,
            child: CircleAvatar(
              backgroundColor: Colors.white,
              child: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),

          // Harita Ortasındaki Sabit Pin (Manuel Konum Seçme Modunda)
          if (_isSelectingLocationMode)
            const IgnorePointer(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.only(bottom: 40), // Pin ucunu merkeze oturtmak için padding
                  child: Icon(Icons.location_on, color: Colors.orange, size: 50),
                ),
              ),
            ),

          // Üst Bilgi Başlığı (Manuel Konum Seçme Modunda)
          if (_isSelectingLocationMode)
            Positioned(
              top: 110,
              left: 20,
              right: 20,
              child: Card(
                color: Colors.white.withOpacity(0.95),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: Colors.orange),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          "Lütfen haritayı kaydırarak kirli bölgenin tam yerini seçiniz.",
                          style: TextStyle(color: Colors.grey[800], fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Alt Karar Butonları (Manuel Konum Seçme Modunda)
          if (_isSelectingLocationMode)
            Positioned(
              bottom: 40,
              left: 20,
              right: 20,
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey[300],
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        setState(() {
                          _isSelectingLocationMode = false;
                        });
                      },
                      child: const Text("Vazgeç", style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        _selectedLocation = _mapController.camera.center;
                        setState(() {
                          _isSelectingLocationMode = false;
                        });
                        _showReportForm();
                      },
                      child: const Text("Konumu Onayla", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),

          // 🚨 MODERN RAPORLAMA BUTONU (Yalnızca normal harita modunda görünür)
          if (!_isSelectingLocationMode)
            Positioned(
              bottom: 100,
              right: 20,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  // Bilgi Baloncuğu (Label)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)
                      ],
                    ),
                    child: const Text(
                      "Kirlilik Bildir",
                      style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 2.seconds),
                  const SizedBox(height: 8),
                  // Ana Buton
                  GestureDetector(
                    onTap: _startReportProcess,
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Colors.orange,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.orange.withOpacity(0.4),
                            blurRadius: 20,
                            spreadRadius: 5,
                          ),
                        ],
                        border: Border.all(color: Colors.white, width: 3),
                      ),
                      child: const Icon(Icons.add_a_photo_rounded, color: Colors.white, size: 30),
                    ),
                  ).animate(onPlay: (c) => c.repeat())
                    .scale(duration: 1.seconds, begin: const Offset(1, 1), end: const Offset(1.1, 1.1), curve: Curves.easeInOut)
                    .then()
                    .scale(duration: 1.seconds, begin: const Offset(1.1, 1.1), end: const Offset(1, 1), curve: Curves.easeInOut),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _startReportProcess() async {
    LocationPermission permission = await Geolocator.checkPermission();
    bool hasPermission = permission == LocationPermission.always || permission == LocationPermission.whileInUse;

    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      hasPermission = permission == LocationPermission.always || permission == LocationPermission.whileInUse;
    }

    if (!hasPermission) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Konum izni alınamadı. Haritanın merkez konumu kullanılıyor."),
          backgroundColor: Colors.orange,
        ),
      );
      _selectedLocation = _mapController.camera.center;
      _showReportForm();
      return;
    }

    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      final LatLng gpsLoc = LatLng(position.latitude, position.longitude);

      _mapController.move(gpsLoc, 15.0);

      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text("Konum Doğrulama"),
          content: const Text("Harita üzerindeki konumunuz doğru mu?"),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                setState(() {
                  _isSelectingLocationMode = true;
                });
              },
              child: const Text("Hayır", style: TextStyle(color: Colors.red)),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                _selectedLocation = gpsLoc;
                _showReportForm();
              },
              child: const Text("Evet", style: TextStyle(color: Colors.green)),
            ),
          ],
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Konum alınamadı: $e. Mevcut harita konumu kullanılıyor."),
          backgroundColor: Colors.orange,
        ),
      );
      _selectedLocation = _mapController.camera.center;
      _showReportForm();
    }
  }

  void _showReportForm() {
    _descriptionController.clear();
    _imagesBytes.clear();
    String _selectedAreaSize = 'small';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          _descriptionController.addListener(() {
            if (mounted) setModalState(() {});
          });

          bool isValid = _descriptionController.text.trim().isNotEmpty || _imagesBytes.isNotEmpty;

          return Container(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              top: 24,
              left: 24,
              right: 24,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(30),
                topRight: Radius.circular(30),
              ),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Kirli Alan Raporla",
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  
                  _buildPhotoGrid(setModalState),
                  
                  const SizedBox(height: 20),
                  const Text("Alan Boyutu", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          label: const Center(child: Text("Küçük / Normal")),
                          selected: _selectedAreaSize == 'small',
                          selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                          checkmarkColor: AppTheme.primaryColor,
                          labelStyle: TextStyle(
                            color: _selectedAreaSize == 'small' ? AppTheme.primaryColor : Colors.black87,
                            fontWeight: FontWeight.bold,
                          ),
                          onSelected: (selected) {
                            if (selected) {
                              setModalState(() {
                                _selectedAreaSize = 'small';
                              });
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ChoiceChip(
                          label: const Center(child: Text("Geniş / Büyük")),
                          selected: _selectedAreaSize == 'large',
                          selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                          checkmarkColor: AppTheme.primaryColor,
                          labelStyle: TextStyle(
                            color: _selectedAreaSize == 'large' ? AppTheme.primaryColor : Colors.black87,
                            fontWeight: FontWeight.bold,
                          ),
                          onSelected: (selected) {
                            if (selected) {
                              setModalState(() {
                                _selectedAreaSize = 'large';
                              });
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 20),
                  const Text("Açıklama", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _descriptionController,
                    decoration: InputDecoration(
                      hintText: "Kirlilik veya bölge hakkında kısa bir açıklama yazın...",
                      filled: true,
                      fillColor: Colors.grey[50],
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(15),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 30),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        disabledBackgroundColor: Colors.grey[300],
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                      ),
                      onPressed: (!isValid || _isUploading) ? null : () async {
                        setModalState(() {
                          _isUploading = true;
                        });

                        try {
                           final firestore = Provider.of<FirestoreService>(context, listen: false);
                           final user = Provider.of<User?>(context, listen: false);
                           final LatLng loc = _selectedLocation ?? _mapController.camera.center;

                           await firestore.submitReportWithImages(
                             userId: user?.uid ?? 'anonymous',
                             latitude: loc.latitude,
                             longitude: loc.longitude,
                             description: _descriptionController.text,
                             imagesBytes: _imagesBytes,
                             areaSize: _selectedAreaSize,
                           );

                          if (mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text("Raporunuz başarıyla gönderildi!"),
                                backgroundColor: Colors.green,
                              ),
                            );
                          }
                        } catch (e) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text("Rapor gönderilemedi: $e")),
                          );
                        } finally {
                          if (mounted) {
                            setModalState(() {
                              _isUploading = false;
                            });
                          }
                        }
                      },
                      child: _isUploading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text("Paylaş", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPhotoGrid(StateSetter setModalState) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(3, (index) {
        bool hasImage = index < _imagesBytes.length;
        bool isAddButton = index == _imagesBytes.length;

        return Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 4),
            height: 100,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: hasImage
                ? Stack(
                    fit: StackFit.expand,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.memory(
                          _imagesBytes[index],
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 2,
                        right: 2,
                        child: GestureDetector(
                          onTap: () => _removeImage(index, setModalState),
                          child: const CircleAvatar(
                            radius: 12,
                            backgroundColor: Colors.red,
                            child: Icon(Icons.close, size: 14, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  )
                : isAddButton
                    ? InkWell(
                        onTap: () {
                          showModalBottomSheet(
                            context: context,
                            backgroundColor: Colors.white,
                            shape: const RoundedRectangleBorder(
                              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                            ),
                            builder: (ctx) => SafeArea(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  ListTile(
                                    leading: const Icon(Icons.camera_alt, color: Colors.blue),
                                    title: const Text('Kamera ile Çek'),
                                    onTap: () {
                                      Navigator.pop(ctx);
                                      _pickAndAddImage(ImageSource.camera, setModalState);
                                    },
                                  ),
                                  ListTile(
                                    leading: const Icon(Icons.photo_library, color: Colors.green),
                                    title: const Text('Galeriden Seç (Sadece Bugün)'),
                                    onTap: () {
                                      Navigator.pop(ctx);
                                      _pickAndAddImage(ImageSource.gallery, setModalState);
                                    },
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                        child: const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_a_photo, color: Colors.grey),
                            SizedBox(height: 4),
                            Text("Ekle", style: TextStyle(fontSize: 12, color: Colors.grey)),
                          ],
                        ),
                      )
                    : const Center(
                        child: Icon(Icons.image_not_supported_outlined, color: Colors.grey, size: 24),
                      ),
          ),
        );
      }),
    );
  }

  Future<void> _pickAndAddImage(ImageSource source, StateSetter setModalState) async {
    if (_imagesBytes.length >= 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("En fazla 3 fotoğraf ekleyebilirsiniz!")),
      );
      return;
    }

    try {
      if (!kIsWeb) {
        Permission permission = source == ImageSource.camera ? Permission.camera : Permission.photos;
        PermissionStatus status = await permission.request();
        if (status.isDenied || status.isPermanentlyDenied) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text("Kamera/Galeri erişim izni gerekiyor."),
              action: SnackBarAction(label: "Ayarlar", onPressed: () => openAppSettings()),
            ),
          );
          return;
        }
      }

      final picked = await _picker.pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 1280,
      );

      if (picked != null) {
        if (source == ImageSource.gallery && !kIsWeb) {
          final lastModified = await picked.lastModified();
          final now = DateTime.now();
          if (now.difference(lastModified).inHours > 24 || lastModified.day != now.day) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text("Sadece bugüne ait veya anlık fotoğraflar kabul edilir!"),
                backgroundColor: Colors.red,
              ),
            );
            return;
          }
        }

        final bytes = await picked.readAsBytes();
        setModalState(() {
          _imagesBytes.add(bytes);
        });
        setState(() {});
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Hata: $e')));
    }
  }

  void _removeImage(int index, StateSetter setModalState) {
    setModalState(() {
      _imagesBytes.removeAt(index);
    });
    setState(() {});
  }
}
