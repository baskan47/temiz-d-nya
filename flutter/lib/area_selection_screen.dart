import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'location_service.dart';
import 'firestore_service.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AreaSelectionScreen extends StatefulWidget {
  @override
  _AreaSelectionScreenState createState() => _AreaSelectionScreenState();
}

class _AreaSelectionScreenState extends State<AreaSelectionScreen> {
  late MapController _mapController;
  LatLng? userLocation;
  LatLng? selectedArea;
  List<Marker> markers = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    _getUserLocation();
  }

  void _getUserLocation() async {
    final locationService = LocationService();
    final hasPermission = await locationService.requestLocationPermission();
    
    if (hasPermission) {
      final location = await locationService.getCurrentLocation();
      if (location != null) {
        setState(() {
          userLocation = location;
          isLoading = false;
        });
        _mapController.move(location, 15);
      }
    } else {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Konum izni verilmedi')),
      );
    }
  }

  void _addMarker(LatLng position) {
    setState(() {
      selectedArea = position;
      markers = [
        Marker(
          width: 40,
          height: 40,
          point: position,
          child: Icon(Icons.location_on, color: Colors.red, size: 36),
        ),
      ];
    });
  }

  void _submitArea() async {
    if (selectedArea == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lütfen harita üzerinde bir bölge seçin')),
      );
      return;
    }

    final user = Provider.of<User?>(context, listen: false);
    if (user != null) {
      final firestore = Provider.of<FirestoreService>(context, listen: false);
      await firestore.submitReport({
        'reportedBy': user.uid,
        'location': {
          'latitude': selectedArea!.latitude,
          'longitude': selectedArea!.longitude,
        },
        'status': 'open',
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Bölge rapor edildi!')),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Temizlenecek Bölgeyi Seç'),
        actions: [
          if (selectedArea != null)
            TextButton(
              onPressed: _submitArea,
              child: Text('Gönder', style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
      body: Stack(
        children: [
          if (userLocation != null)
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: userLocation!,
                initialZoom: 15.0,
                onTap: (tapPosition, point) => _addMarker(point),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                ),
                MarkerLayer(markers: markers),
              ],
            )
          else if (isLoading)
            Center(child: CircularProgressIndicator())
          else
            Center(child: Text('Konum alınamadı')),
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              margin: EdgeInsets.all(16),
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white70,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                selectedArea == null ? 'Harita üzerinde tıklayarak bölge seçin' : 'Bölge seçildi: ${selectedArea!.latitude.toStringAsFixed(4)}, ${selectedArea!.longitude.toStringAsFixed(4)}',
              ),
            ),
          ),
        ],
      ),
    );
  }
}