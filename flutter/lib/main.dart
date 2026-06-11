import 'package:flutter/material.dart';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';

import 'firebase_config.dart';
import 'auth_service.dart';
import 'auth_screen_improved.dart';
import 'firestore_service.dart';

import 'group_management_screen.dart' hide Text;

import 'settings_screen.dart';

import 'notification_service.dart';
import 'offline_service.dart';
import 'theme.dart';
import 'splash_screen.dart';

import 'home_page_improved.dart';
import 'mobile_home_improved.dart';
import 'emergency_page.dart';
import 'language_provider.dart';
import 'admin_dashboard.dart';
import 'autonomous_device_list_screen.dart';
import 'eco_market_screen.dart';

/// Temiz Dünya web sürümünün URL'si.
const String kTemizDunyaWebUrl = 'https://temiz-dunya.web.app';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await initFirebase();
    await OfflineService().initializeHive();
    await NotificationService().initializeNotifications();
    runApp(TemizDunyaApp());
  } catch (e) {
    debugPrint("Initialization Error: $e");
    runApp(TemizDunyaApp());
  }
}


class TemizDunyaApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        StreamProvider<User?>.value(
          value: AuthService().user,
          initialData: null,
        ),
        Provider<FirestoreService>(
          create: (_) => FirestoreService(),
        ),
        ChangeNotifierProvider<LanguageProvider>(
          create: (_) => LanguageProvider(),
        ),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Temiz Dünya',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        home: SplashScreen(),
        routes: {
          '/auth': (context) => AuthWrapper(),
          '/admin': (context) => const AdminDashboardScreen(),
          '/autonomous_devices': (context) => const AutonomousDeviceListScreen(),
          '/eco_market': (context) => const EcoMarketScreen(),
        },
        onGenerateRoute: (settings) {
          return PageRouteBuilder(
            settings: settings,
            pageBuilder: (context, animation, secondaryAnimation) {
              Widget page;
              
              switch (settings.name) {
                case '/auth':
                  page = AuthWrapper();
                  break;
                case '/autonomous_devices':
                  page = const AutonomousDeviceListScreen();
                  break;
                case '/eco_market':
                  page = const EcoMarketScreen();
                  break;
                default:
                  page = SplashScreen();
              }
              
              return page;
            },
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              return SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(1, 0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(
                  parent: animation,
                  curve: Curves.easeInOutCubic,
                )),
                child: child,
              );
            },
            transitionDuration: Duration(milliseconds: 600),
          );
        },
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final user = Provider.of<User?>(context);
    return user == null ? AuthScreenImproved() : MainHomeScreen();
  }
}

class MainHomeScreen extends StatefulWidget {
  @override
  _MainHomeScreenState createState() => _MainHomeScreenState();
}

class _MainHomeScreenState extends State<MainHomeScreen>
    with SingleTickerProviderStateMixin {
  int _selectedIndex = 2; // Anasayfa default
  late List<Widget> _pages;
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: Duration(milliseconds: 500),
      vsync: this,
    );
    _pages = [
      GroupManagementScreen(),
      HomePageImproved(),
      MobileHomeImproved(
        onNavigate: (index) => setState(() => _selectedIndex = index),
      ),
      EmergencyPage(),
      SettingsScreen(),
    ];
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedSwitcher(
        duration: Duration(milliseconds: 400),
        transitionBuilder: (child, animation) {
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: Offset(0.05, 0),
                end: Offset.zero,
              ).animate(CurvedAnimation(
                parent: animation,
                curve: Curves.easeOut,
              )),
              child: child,
            ),
          );
        },
        child: SizedBox.expand(
          key: ValueKey<int>(_selectedIndex),
          child: _pages[_selectedIndex],
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, offset: Offset(0, -5))
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: AppTheme.primaryColor,
          unselectedItemColor: Colors.grey[400],
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 10),
          onTap: (index) {
            setState(() => _selectedIndex = index);
            _animationController.forward(from: 0.0);
          },
          items: [
            BottomNavigationBarItem(
              icon: Icon(Icons.groups_outlined),
              activeIcon: Icon(Icons.groups),
              label: context.watch<LanguageProvider>().translate('groups'),
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.map_outlined),
              activeIcon: Icon(Icons.map),
              label: context.watch<LanguageProvider>().translate('map'),
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: context.watch<LanguageProvider>().translate('home'),
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.sos_outlined),
              activeIcon: Icon(Icons.sos),
              label: context.watch<LanguageProvider>().translate('sos'),
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.settings_outlined),
              activeIcon: Icon(Icons.settings),
              label: context.watch<LanguageProvider>().translate('settings'),
            ),
          ],
        ),
      ),
    );
  }
}

class GroupsPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('👥 Gruplar'),
        centerTitle: true,
        elevation: 0,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.groups, size: 48, color: Colors.grey[400]),
            SizedBox(height: 16),
            Text(
              'Gruplar Yönetimi',
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'add_group',
        onPressed: () {
          Navigator.push(
            context,
            PageRouteBuilder(
              pageBuilder: (context, animation, secondaryAnimation) =>
                  GroupManagementScreen(),
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return ScaleTransition(
                  scale: Tween<double>(begin: 0.8, end: 1).animate(
                    CurvedAnimation(parent: animation, curve: Curves.easeOut),
                  ),
                  child: FadeTransition(opacity: animation, child: child),
                );
              },
            ),
          );
        },
        child: Icon(Icons.add),
      ),
    );
  }
}
