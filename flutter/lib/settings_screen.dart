import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter/services.dart';
import 'auth_service.dart';
import 'theme.dart';
import 'neomorphic_components.dart';
import 'language_provider.dart';

class SettingsScreen extends StatefulWidget {
  @override
  _SettingsScreenState createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _darkModeEnabled = false;
  bool _locationServicesEnabled = true;
  bool _dataUsageEnabled = false;
  // _selectedLanguage is now managed by LanguageProvider

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<User?>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF0F2F5),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            backgroundColor: AppTheme.primaryColor,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(context.watch<LanguageProvider>().translate('settings'), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              background: Container(color: AppTheme.primaryColor),
            ),
          ),
          SliverList(
            delegate: SliverChildListDelegate([
              const SizedBox(height: 20),
              
              // 👤 1. Account Card & Verification
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: NeumorphicCard(
                  backgroundColor: Colors.white,
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const AccountSecurityScreen())),
                  child: Row(
                    children: [
                      Container(
                        width: 65,
                        height: 65,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(colors: [Color(0xFF2ECC71), Color(0xFF27AE60)]),
                          boxShadow: [
                            BoxShadow(color: Colors.green.withOpacity(0.2), blurRadius: 15, offset: const Offset(0, 5))
                          ],
                        ),
                        child: const Center(
                          child: Icon(Icons.person_rounded, color: Colors.white, size: 35),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?.displayName ?? "Baran Akalan",
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: -0.5),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              user?.email ?? "baranakalan@gmail.com",
                              style: TextStyle(color: Colors.grey[600], fontSize: 13),
                            ),
                            const SizedBox(height: 6),
                            // Verification Status
                            Row(
                              children: [
                                Icon(
                                  user?.emailVerified == true ? Icons.verified : Icons.error_outline,
                                  color: user?.emailVerified == true ? Colors.green : Colors.red,
                                  size: 14,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  user?.emailVerified == true ? context.watch<LanguageProvider>().translate('verified_account') : context.watch<LanguageProvider>().translate('email_not_verified'),
                                  style: TextStyle(
                                    color: user?.emailVerified == true ? Colors.green[700] : Colors.red[700],
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: Colors.grey, size: 22),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 30),

              // 📊 2. Account Settings Section
              _buildSectionHeader(context.watch<LanguageProvider>().translate('account_settings')),
              _buildSettingsItem(
                icon: Icons.person_outline_rounded,
                title: context.watch<LanguageProvider>().translate('profile'),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const AccountSecurityScreen())),
              ),

              const SizedBox(height: 25),

              // ⚙️ 3. App Settings Section
              _buildSectionHeader(context.watch<LanguageProvider>().translate('app_settings')),
              _buildSettingsItem(
                icon: Icons.notifications_none_rounded,
                title: context.watch<LanguageProvider>().translate('notifications'),
                onTap: () => _showNotificationOptions(context),
              ),
              _buildToggleItem(
                icon: Icons.dark_mode_outlined,
                title: context.watch<LanguageProvider>().translate('dark_mode'),
                value: _darkModeEnabled,
                onChanged: (v) {
                  setState(() => _darkModeEnabled = v);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(v ? context.read<LanguageProvider>().translate('dark_mode_active') : context.read<LanguageProvider>().translate('light_mode_active')), duration: 1.seconds),
                  );
                },
              ),
              _buildSettingsItem(
                icon: Icons.translate_rounded,
                title: context.watch<LanguageProvider>().translate('language_selection'),
                subtitle: context.watch<LanguageProvider>().currentLanguage == 'tr' ? "Türkçe" : (context.watch<LanguageProvider>().currentLanguage == 'en' ? "English" : "Deutsch"),
                onTap: () => _showLanguageSelection(context),
              ),
              _buildToggleItem(
                icon: Icons.location_on_outlined,
                title: context.watch<LanguageProvider>().translate('location_services'),
                value: _locationServicesEnabled,
                onChanged: (v) => setState(() => _locationServicesEnabled = v),
              ),
              _buildSettingsItem(
                icon: Icons.data_usage_rounded,
                title: context.watch<LanguageProvider>().translate('data_usage'),
                onTap: () => _showDataUsageDetails(context),
              ),

              const SizedBox(height: 25),

              // 🆘 4. Support & Info Section
              _buildSectionHeader(context.watch<LanguageProvider>().translate('support_info')),
              _buildSettingsItem(
                icon: Icons.help_center_outlined,
                title: context.watch<LanguageProvider>().translate('help_center'),
                onTap: () => _showHelpCenter(context),
              ),
              _buildSettingsItem(
                icon: Icons.info_outline_rounded,
                title: context.watch<LanguageProvider>().translate('version_info'),
                subtitle: "v1.0.4-improved",
                onTap: () {},
              ),
              _buildSettingsItem(
                icon: Icons.privacy_tip_outlined,
                title: context.watch<LanguageProvider>().translate('privacy_policy'),
                onTap: () => _showDocumentViewer(context, context.read<LanguageProvider>().translate('privacy_policy')),
              ),
              _buildSettingsItem(
                icon: Icons.description_outlined,
                title: context.watch<LanguageProvider>().translate('terms_of_use'),
                onTap: () => _showDocumentViewer(context, context.read<LanguageProvider>().translate('terms_of_use')),
              ),

              const SizedBox(height: 40),

              // 🚪 5. Sign Out Button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: NeumorphicButton(
                  onPressed: () => _confirmLogout(context),
                  backgroundColor: Colors.white,
                  child: Center(
                    child: Text(
                      context.watch<LanguageProvider>().translate('sign_out'),
                      style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 60),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w800,
          color: Colors.grey[500],
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildSettingsItem({required IconData icon, required String title, String? subtitle, required VoidCallback onTap}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      child: NeumorphicCard(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        backgroundColor: Colors.white,
        onTap: onTap,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: const Color(0xFF1B6E4F), size: 22),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF1E293B))),
                  if (subtitle != null)
                    Text(subtitle, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Colors.grey, size: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildToggleItem({required IconData icon, required String title, required bool value, required Function(bool) onChanged}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      child: NeumorphicCard(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        backgroundColor: Colors.white,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: const Color(0xFF1B6E4F), size: 22),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF1E293B))),
            ),
            Switch(
              value: value,
              onChanged: onChanged,
              activeColor: AppTheme.primaryColor,
            ),
          ],
        ),
      ),
    );
  }

  // --- Sub Menus and Dialogs ---

  void _showNotificationOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(context.watch<LanguageProvider>().translate('notifications_active'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            SwitchListTile(title: Text(context.watch<LanguageProvider>().translate('instant_notifications')), value: true, onChanged: (v) {}, activeColor: AppTheme.primaryColor),
            SwitchListTile(title: Text(context.watch<LanguageProvider>().translate('email_announcements')), value: false, onChanged: (v) {}, activeColor: AppTheme.primaryColor),
            SwitchListTile(title: Text(context.watch<LanguageProvider>().translate('weekly_summary')), value: true, onChanged: (v) {}, activeColor: AppTheme.primaryColor),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  void _showLanguageSelection(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.watch<LanguageProvider>().translate('language_selection_dialog')),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile(title: const Text("Türkçe"), value: 'tr', groupValue: context.watch<LanguageProvider>().currentLanguage, onChanged: (v) { context.read<LanguageProvider>().setLanguage(v!); Navigator.pop(context); }),
            RadioListTile(title: const Text("English"), value: 'en', groupValue: context.watch<LanguageProvider>().currentLanguage, onChanged: (v) { context.read<LanguageProvider>().setLanguage(v!); Navigator.pop(context); }),
            RadioListTile(title: const Text("Deutsch"), value: 'de', groupValue: context.watch<LanguageProvider>().currentLanguage, onChanged: (v) { context.read<LanguageProvider>().setLanguage(v!); Navigator.pop(context); }),
          ],
        ),
      ),
    );
  }

  void _showDataUsageDetails(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(context.watch<LanguageProvider>().translate('data_usage_dialog'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            ListTile(leading: const Icon(Icons.storage), title: Text(context.watch<LanguageProvider>().translate('total_consumption')), trailing: const Text("124 MB")),
            SwitchListTile(
              title: Text(context.watch<LanguageProvider>().translate('wifi_only_upload')),
              subtitle: Text(context.watch<LanguageProvider>().translate('data_saving_desc')),
              value: true,
              onChanged: (v) {},
              activeColor: AppTheme.primaryColor,
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  void _showHelpCenter(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(context.watch<LanguageProvider>().translate('help_center_dialog'), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            Expanded(
              child: ListView(
                children: [
                  ListTile(title: Text(context.watch<LanguageProvider>().translate('faq')), trailing: const Icon(Icons.chevron_right), onTap: () {}),
                  ListTile(title: Text(context.watch<LanguageProvider>().translate('live_support')), subtitle: Text(context.watch<LanguageProvider>().translate('live_support_desc')), trailing: const Icon(Icons.chat_bubble_outline), onTap: () {}),
                  ListTile(title: Text(context.watch<LanguageProvider>().translate('report_bug')), trailing: const Icon(Icons.bug_report_outlined), onTap: () {}),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDocumentViewer(BuildContext context, String title) {
    Navigator.push(context, MaterialPageRoute(builder: (context) => Scaffold(
      appBar: AppBar(title: Text(title), backgroundColor: AppTheme.primaryColor),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Text(
          "Bu bir örnek döküman metnidir. $title metni burada yer alacaktır. " * 50,
          style: const TextStyle(fontSize: 16, height: 1.5),
        ),
      ),
    )));
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.watch<LanguageProvider>().translate('sign_out')),
        content: Text(context.watch<LanguageProvider>().translate('exit_confirm')),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(context.watch<LanguageProvider>().translate('cancel'))),
          ElevatedButton(
            onPressed: () async {
              await AuthService().signOut();
              Navigator.of(context).pushNamedAndRemoveUntil('/auth', (route) => false);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: Text(context.watch<LanguageProvider>().translate('yes_exit'), style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

// --- 🔐 1. ACCOUNT SECURITY SCREEN (STATED) ---

class AccountSecurityScreen extends StatefulWidget {
  const AccountSecurityScreen({super.key});

  @override
  _AccountSecurityScreenState createState() => _AccountSecurityScreenState();
}

class _AccountSecurityScreenState extends State<AccountSecurityScreen> {
  final AuthService _authService = AuthService();
  String? _verificationId;
  bool _isSendingCode = false;

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<User?>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.watch<LanguageProvider>().translate('account_security'), style: const TextStyle(fontWeight: FontWeight.bold)),
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new), onPressed: () => Navigator.pop(context)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildSecurityCard(
            title: "Gmail / Google Bağlantısı",
            subtitle: user?.email ?? "baranakalan@gmail.com",
            status: user?.emailVerified == true ? "Aktif" : "Doğrulama Bekliyor",
            statusColor: user?.emailVerified == true ? Colors.green : Colors.orange,
            onAction: () => _showEmailChangeDialog(context),
            actionLabel: "E-postayı Güncelle",
          ),
          const SizedBox(height: 16),
          _buildSecurityCard(
            title: "Telefon Numarası",
            subtitle: user?.phoneNumber ?? "Henüz eklenmedi",
            status: user?.phoneNumber != null ? "Aktif" : "Bağlantı Yok",
            statusColor: user?.phoneNumber != null ? Colors.green : Colors.grey,
            onAction: () => _showPhoneVerification(context),
            actionLabel: user?.phoneNumber != null ? "Numarayı Değiştir" : "Telefon Ekle",
          ),
        ],
      ),
    );
  }

  Widget _buildSecurityCard({required String title, required String subtitle, required String status, required Color statusColor, required VoidCallback onAction, required String actionLabel}) {
    return NeumorphicCard(
      backgroundColor: Colors.white,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 4),
          Text(subtitle, style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Text(status, style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
              TextButton(onPressed: onAction, child: Text(actionLabel, style: const TextStyle(fontWeight: FontWeight.bold))),
            ],
          ),
        ],
      ),
    );
  }

  void _showEmailChangeDialog(BuildContext context) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("E-posta Güncelle"),
        content: TextField(controller: controller, decoration: const InputDecoration(labelText: "Yeni E-posta Adresi")),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("İptal")),
          ElevatedButton(
            onPressed: () async {
              try {
                await _authService.updateEmail(controller.text);
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Doğrulama e-postası yeni adresinize gönderildi!")));
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Hata: $e")));
              }
            },
            child: const Text("Güncelle"),
          ),
        ],
      ),
    );
  }

  void _showPhoneVerification(BuildContext context) {
    final phoneController = TextEditingController();
    final otpController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_verificationId == null ? "Telefon Numarası Ekle" : "Kodu Doğrula", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              if (_verificationId == null)
                TextField(
                  controller: phoneController,
                  decoration: const InputDecoration(labelText: "Telefon Numarası", hintText: "+90 5XX XXX XX XX", border: OutlineInputBorder()),
                  keyboardType: TextInputType.phone,
                )
              else
                TextField(
                  controller: otpController,
                  decoration: const InputDecoration(labelText: "SMS Kodu", hintText: "XXXXXX", border: OutlineInputBorder()),
                  keyboardType: TextInputType.number,
                ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: _isSendingCode 
                  ? const Center(child: CircularProgressIndicator())
                  : ElevatedButton(
                    onPressed: () async {
                      if (_verificationId == null) {
                        setModalState(() => _isSendingCode = true);
                        await _authService.verifyPhone(
                          phoneNumber: phoneController.text,
                          codeSent: (id, token) {
                            setModalState(() { _verificationId = id; _isSendingCode = false; });
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("SMS Kodu Gönderildi!")));
                          },
                          verificationFailed: (e) {
                            setModalState(() => _isSendingCode = false);
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Hata: ${e.message}")));
                          },
                          verificationCompleted: (cred) async {
                            await FirebaseAuth.instance.currentUser?.linkWithCredential(cred);
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Telefon Başarıyla Doğrulandı!")));
                          },
                          codeAutoRetrievalTimeout: (id) => _verificationId = id,
                        );
                      } else {
                        setModalState(() => _isSendingCode = true);
                        bool success = await _authService.linkPhone(_verificationId!, otpController.text);
                        setModalState(() => _isSendingCode = false);
                        if (success) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Telefon Başarıyla Doğrulandı!")));
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Hatalı SMS kodu!")));
                        }
                      }
                    },
                    child: Text(_verificationId == null ? "Kodu Gönder" : "Doğrula"),
                  ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}

// --- 👤 2. PROFILE EDIT SCREEN ---

class ProfileEditScreen extends StatelessWidget {
  const ProfileEditScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<User?>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.watch<LanguageProvider>().translate('edit_profile')),
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new), onPressed: () => Navigator.pop(context)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Profile Photo with Edit Icon
            Stack(
              alignment: Alignment.bottomRight,
              children: [
                CircleAvatar(
                  radius: 60,
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                  child: user?.photoURL != null 
                    ? ClipOval(child: Image.network(user!.photoURL!, width: 120, height: 120, fit: BoxFit.cover))
                    : const Icon(Icons.person, size: 80, color: Color(0xFF1B6E4F)),
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle),
                  child: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Copyable ID
            GestureDetector(
              onTap: () {
                Clipboard.setData(ClipboardData(text: user?.uid.substring(0, 8).toUpperCase() ?? "#BA2024"));
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.read<LanguageProvider>().translate('user_id_copied'))));
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(15)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text("${context.watch<LanguageProvider>().translate('user_id')}: ", style: const TextStyle(color: Colors.grey)),
                    Text(user?.uid.substring(0, 8).toUpperCase() ?? "#BA2024", style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(width: 8),
                    const Icon(Icons.copy, size: 14, color: Colors.grey),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 30),
            _buildTextField(context.watch<LanguageProvider>().translate('full_name'), user?.displayName ?? "Baran Akalan"),
            _buildTextField(context.watch<LanguageProvider>().translate('username'), user?.email?.split('@')[0] ?? "baranakalan"),
            _buildTextField(context.watch<LanguageProvider>().translate('bio'), "Doğa ve çevre gönüllüsü."),
            _buildTextField(context.watch<LanguageProvider>().translate('phone'), user?.phoneNumber ?? "+90 530 XXX XX XX"),
            const SizedBox(height: 50),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.read<LanguageProvider>().translate('profile_updated'))));
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor, padding: const EdgeInsets.symmetric(vertical: 18), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
                child: Text(context.watch<LanguageProvider>().translate('save_changes'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String label, String initialValue) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: TextField(
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
        ),
        controller: TextEditingController(text: initialValue),
      ),
    );
  }
}
