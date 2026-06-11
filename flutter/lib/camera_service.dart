// No dart:io import here for web compatibility
import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

class CameraService {
  late CameraController cameraController;
  late List<CameraDescription> cameras;

  Future<void> initializeCamera() async {
    cameras = await availableCameras();
    if (cameras.isNotEmpty) {
      cameraController = CameraController(
        cameras[0],
        ResolutionPreset.high,
      );
      await cameraController.initialize();
    }
  }

  Future<bool> requestCameraPermission() async {
    final status = await Permission.camera.request();
    return status.isGranted;
  }

  Future<XFile?> takePicture() async {
    try {
      final image = await cameraController.takePicture();
      return image;
    } catch (e) {
      print('Fotoğraf çekme hatası: $e');
      return null;
    }
  }

  Future<void> dispose() async {
    await cameraController.dispose();
  }
}

class ImageService {
  final ImagePicker _imagePicker = ImagePicker();

  Future<XFile?> pickImageFromGallery() async {
    try {
      final pickedFile = await _imagePicker.pickImage(source: ImageSource.gallery);
      if (pickedFile != null) {
        return pickedFile;
      }
    } catch (e) {
      print('Galeri seçme hatası: $e');
    }
    return null;
  }

  Future<XFile?> pickImageFromCamera() async {
    try {
      final pickedFile = await _imagePicker.pickImage(source: ImageSource.camera);
      if (pickedFile != null) {
        return pickedFile;
      }
    } catch (e) {
      print('Kamera seçme hatası: $e');
    }
    return null;
  }
}