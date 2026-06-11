import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:math';

// ─── Auth hatası → kullanıcı dostu mesaj ───────────────────────────────────
String authErrorMessage(FirebaseAuthException e) {
  switch (e.code) {
    case 'invalid-email':
      return 'Geçersiz e-posta adresi. Lütfen kontrol edin.';
    case 'invalid-credential':
    case 'user-not-found':
    case 'wrong-password':
      return 'E-posta adresi veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.';
    case 'email-already-in-use':
      return 'Bu e-posta adresi ile kayıtlı bir hesap zaten var.';
    case 'weak-password':
      return 'Şifre çok zayıf. En az 8 karakter, büyük harf ve rakam ekleyin.';
    case 'operation-not-allowed':
      return 'Bu giriş yöntemi şu an devre dışı.';
    case 'user-disabled':
      return 'Bu hesap devre dışı bırakılmış.';
    case 'too-many-requests':
      return 'Çok fazla deneme. Lütfen birkaç dakika bekleyin.';
    case 'network-request-failed':
      return 'İnternet bağlantısı yok. Bağlantınızı kontrol edin.';
    case 'credential-already-in-use':
      return 'Bu kimlik bilgisi başka bir hesaba bağlı.';
    case 'requires-recent-login':
      return 'Bu işlem için yeniden giriş yapmanız gerekiyor.';
    case 'invalid-verification-code':
      return 'Doğrulama kodu yanlış. Lütfen tekrar girin.';
    case 'invalid-phone-number':
      return 'Geçersiz telefon numarası. +90 ile başladığından emin olun.';
    case 'session-expired':
      return 'Doğrulama süresi doldu. Yeniden kod isteyin.';
    default:
      return 'Bir hata oluştu: ${e.message ?? e.code}';
  }
}

class AuthResult {
  final User? user;
  final String? error;
  bool get success => user != null && error == null;
  const AuthResult({this.user, this.error});
}

// ─────────────────────────────────────────────────────────────────────────────
class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: kIsWeb ? '762121478248-dummy.apps.googleusercontent.com' : null,
    scopes: ['email', 'profile'],
  );

  // ── Stream ────────────────────────────────────────────────────────────────
  Stream<User?> get user => _auth.authStateChanges();
  User? get currentUser => _auth.currentUser;

  // ── Persistence: LOCAL (cihaz kapansa bile oturum devam eder) ────────────
  Future<void> setPersistence(bool remember) async {
    // Web'de LOCAL/SESSION seçeneği vardır; mobilde Firebase zaten kalıcıdır.
    if (kIsWeb) {
      await _auth.setPersistence(
        remember ? Persistence.LOCAL : Persistence.SESSION,
      );
    }
  }

  // ── E-posta / Şifre ile Kayıt ─────────────────────────────────────────────
  Future<AuthResult> registerWithEmail({
    required String email,
    required String password,
    required String displayName,
    bool rememberMe = true,
  }) async {
    try {
      await setPersistence(rememberMe);
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      final user = credential.user!;
      await user.updateDisplayName(displayName.trim());
      await user.sendEmailVerification();
      await _createUserProfile(user, displayName: displayName.trim());
      return AuthResult(user: user);
    } on FirebaseAuthException catch (e) {
      return AuthResult(error: authErrorMessage(e));
    } catch (e) {
      return AuthResult(error: 'Beklenmeyen hata: $e');
    }
  }

  // ── E-posta / Şifre ile Giriş ─────────────────────────────────────────────
  Future<AuthResult> loginWithEmail({
    required String email,
    required String password,
    bool rememberMe = true,
  }) async {
    try {
      await setPersistence(rememberMe);
      final credential = await _auth.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      final user = credential.user;
      if (user != null) {
        // Otomatik iyileştirme: Profil dokümanı yoksa oluştur
        await _createUserProfile(user, displayName: user.displayName);

        // Geriye dönük uyumluluk: Short ID yoksa oluştur
        final doc = await _db.collection('users').doc(user.uid).get();
        if (doc.exists && doc.data()?['shortId'] == null) {
          await _db.collection('users').doc(user.uid).update({
            'shortId': _generateShortId(),
          });
        }
      }
      return AuthResult(user: user);
    } on FirebaseAuthException catch (e) {
      return AuthResult(error: authErrorMessage(e));
    } catch (e) {
      return AuthResult(error: 'Beklenmeyen hata: $e');
    }
  }

  // ── Google Sign-In ────────────────────────────────────────────────────────
  Future<AuthResult> signInWithGoogle({bool rememberMe = true}) async {
    try {
      await setPersistence(rememberMe);

      GoogleSignInAccount? googleUser;
      if (kIsWeb) {
        try {
          googleUser = await _googleSignIn.signInSilently();
        } catch (_) {
          googleUser = null;
        }
        googleUser ??= await _googleSignIn.signIn();
      } else {
        googleUser = await _googleSignIn.signIn();
      }

      if (googleUser == null) {
        return const AuthResult(error: 'Google girişi iptal edildi.');
      }

      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential = await _auth.signInWithCredential(credential);
      final user = userCredential.user!;

      // Profil dokümanı yoksa oluştur (otomatik iyileştirme)
      await _createUserProfile(user);

      return AuthResult(user: user);
    } on FirebaseAuthException catch (e) {
      return AuthResult(error: authErrorMessage(e));
    } catch (e) {
      return AuthResult(error: 'Google girişi başarısız: $e');
    }
  }

  // ── Telefon Doğrulama – Kod Gönder ───────────────────────────────────────
  Future<void> sendPhoneOtp({
    required String phoneNumber,
    required void Function(String verificationId, int? resendToken) codeSent,
    required void Function(String error) onError,
    required void Function(PhoneAuthCredential credential) autoVerified,
    required void Function(String verificationId) autoRetrievalTimeout,
  }) async {
    try {
      await _auth.verifyPhoneNumber(
        phoneNumber: phoneNumber.trim(),
        timeout: const Duration(seconds: 60),
        verificationCompleted: autoVerified,
        verificationFailed: (e) => onError(authErrorMessage(e)),
        codeSent: codeSent,
        codeAutoRetrievalTimeout: autoRetrievalTimeout,
      );
    } on FirebaseAuthException catch (e) {
      onError(authErrorMessage(e));
    } catch (e) {
      onError('Telefon doğrulama başlatılamadı: $e');
    }
  }

  // ── Telefon OTP – Kodu Doğrula ve Giriş Yap ──────────────────────────────
  Future<AuthResult> verifyPhoneOtp({
    required String verificationId,
    required String smsCode,
    bool rememberMe = true,
  }) async {
    try {
      await setPersistence(rememberMe);
      final credential = PhoneAuthProvider.credential(
        verificationId: verificationId,
        smsCode: smsCode.trim(),
      );
      final userCredential = await _auth.signInWithCredential(credential);
      final user = userCredential.user!;
      
      // Profil dokümanı yoksa oluştur (otomatik iyileştirme)
      await _createUserProfile(user);
      
      return AuthResult(user: user);
    } on FirebaseAuthException catch (e) {
      return AuthResult(error: authErrorMessage(e));
    } catch (e) {
      return AuthResult(error: 'OTP doğrulaması başarısız: $e');
    }
  }

  // ── Şifre Sıfırlama ────────────────────────────────────────────────────────
  Future<String?> sendPasswordReset(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email.trim());
      return null; // null = başarılı
    } on FirebaseAuthException catch (e) {
      return authErrorMessage(e);
    } catch (e) {
      return 'Şifre sıfırlama e-postası gönderilemedi.';
    }
  }

  // ── E-posta Doğrulandı mı? ────────────────────────────────────────────────
  Future<bool> reloadAndCheckVerification() async {
    try {
      await _auth.currentUser?.reload();
      return _auth.currentUser?.emailVerified ?? false;
    } catch (_) {
      return false;
    }
  }

  // ── Profil Güncelle ────────────────────────────────────────────────────────
  Future<String?> updateDisplayName(String name) async {
    try {
      await _auth.currentUser?.updateDisplayName(name.trim());
      await _db
          .collection('users')
          .doc(_auth.currentUser?.uid)
          .update({'name': name.trim(), 'updatedAt': FieldValue.serverTimestamp()});
      return null;
    } on FirebaseAuthException catch (e) {
      return authErrorMessage(e);
    } catch (e) {
      return 'İsim güncellenemedi: $e';
    }
  }

  // ── E-posta Güncelle (doğrulama linki ile) ────────────────────────────────
  Future<String?> updateEmail(String newEmail) async {
    try {
      await _auth.currentUser?.verifyBeforeUpdateEmail(newEmail.trim());
      return null;
    } on FirebaseAuthException catch (e) {
      return authErrorMessage(e);
    } catch (e) {
      return 'E-posta güncellenemedi: $e';
    }
  }

  // ── Telefon Hattını Mevcut Hesaba Bağla ──────────────────────────────────
  Future<String?> linkPhoneToAccount({
    required String verificationId,
    required String smsCode,
  }) async {
    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: verificationId,
        smsCode: smsCode.trim(),
      );
      await _auth.currentUser?.linkWithCredential(credential);
      await _db
          .collection('users')
          .doc(_auth.currentUser?.uid)
          .update({'phoneLinked': true, 'updatedAt': FieldValue.serverTimestamp()});
      return null;
    } on FirebaseAuthException catch (e) {
      return authErrorMessage(e);
    } catch (e) {
      return 'Telefon bağlanamadı: $e';
    }
  }

  // ── Anket Sonuçlarını Kaydet ───────────────────────────────────────────────
  Future<void> saveSurveyResults({
    required String uid,
    required Map<String, dynamic> surveyData,
  }) async {
    try {
      await _db.collection('users').doc(uid).update({
        'preferences.surveyResults': surveyData,
        'preferences.surveyCompletedAt': FieldValue.serverTimestamp(),
        'onboardingCompleted': true,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Survey save error: $e');
    }
  }

  // ── Çıkış ──────────────────────────────────────────────────────────────────
  Future<void> signOut() async {
    await _googleSignIn.signOut().catchError((_) => null);
    await _auth.signOut();
  }

  // ── Firestore'da Kullanıcı Profili Oluştur ────────────────────────────────
  Future<void> _createUserProfile(User user, {String? displayName}) async {
    try {
      final docRef = _db.collection('users').doc(user.uid);
      final doc = await docRef.get();
      
      if (!doc.exists) {
        final shortId = _generateShortId();
        await docRef.set({
          'uid': user.uid,
          'shortId': shortId, // Yeni: Gönüllü ID (#TMZ-1234)
          'name': displayName ?? user.displayName ?? 'Gönüllü',
          'email': user.email ?? '',
          'photoUrl': user.photoURL ?? '',
          'role': 'volunteer',
          'verified': false,
          'ecoPoints': 0.0,
          'cleanupCount': 0,
          'level': 'Çaylak',
          'badge': '🌱',
          'groupId': null,
          'onboardingCompleted': false,
          'preferences': {
            'notifications': true,
            'language': 'tr',
            'darkMode': false,
            'surveyResults': null,
          },
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      print('Profile creation error: $e');
    }
  }

  // ─── Eski uyumluluk methodları (mevcut ekranlar kırılmasın) ──────────────
  @Deprecated('Use registerWithEmail() instead')
  Future<User?> registerWithEmailLegacy(String email, String password) async {
    final r = await registerWithEmail(
        email: email, password: password, displayName: 'Gönüllü');
    return r.user;
  }

  @Deprecated('Use loginWithEmail() instead')
  Future<User?> loginWithEmailLegacy(String email, String password) async {
    final r = await loginWithEmail(email: email, password: password);
    return r.user;
  }

  Future<bool> sendEmailVerification() async {
    try {
      final u = _auth.currentUser;
      if (u != null && !u.emailVerified) {
        await u.sendEmailVerification();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  bool get isEmailVerified => _auth.currentUser?.emailVerified ?? false;

  Future<bool> reloadUser() async {
    try {
      await _auth.currentUser?.reload();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> sendPasswordResetEmail(String email) async {
    final err = await sendPasswordReset(email);
    return err == null;
  }

  Future<bool> updateUserProfile({String? displayName, String? photoUrl}) async {
    try {
      await _auth.currentUser?.updateProfile(
        displayName: displayName,
        photoURL: photoUrl,
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> verifyPhone({
    required String phoneNumber,
    required Function(String, int?) codeSent,
    required Function(FirebaseAuthException) verificationFailed,
    required Function(PhoneAuthCredential) verificationCompleted,
    required Function(String) codeAutoRetrievalTimeout,
  }) async {
    await sendPhoneOtp(
      phoneNumber: phoneNumber,
      codeSent: codeSent,
      onError: (msg) => verificationFailed(
          FirebaseAuthException(code: 'unknown', message: msg)),
      autoVerified: verificationCompleted,
      autoRetrievalTimeout: codeAutoRetrievalTimeout,
    );
  }

  Future<bool> linkPhone(String verificationId, String smsCode) async {
    final err = await linkPhoneToAccount(
        verificationId: verificationId, smsCode: smsCode);
    return err == null;
  }

  // ── Short ID Oluşturucu ───────────────────────────────────────────────────
  String _generateShortId() {
    final random = Random();
    final number = random.nextInt(9000) + 1000; // 1000 - 9999
    return 'TMZ-$number';
  }
}