import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'language_provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:async';
import 'dart:typed_data';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'theme.dart';
import 'neomorphic_components.dart';
import 'image_analysis_service.dart';
import 'analysis_result_sheet.dart';
import 'firestore_service.dart';

class GroupManagementScreen extends StatefulWidget {
  final String? initialGroupId;

  const GroupManagementScreen({Key? key, this.initialGroupId}) : super(key: key);

  @override
  _GroupManagementScreenState createState() => _GroupManagementScreenState();
}

class _GroupManagementScreenState extends State<GroupManagementScreen> with TickerProviderStateMixin {
  bool _isInOperation = false;
  String? _selectedGroupId;
  String _operationStatus = 'ready'; // ready, cleaning, break

  @override
  void initState() {
    super.initState();
    if (widget.initialGroupId != null) {
      _selectedGroupId = widget.initialGroupId;
      _isInOperation = true;
    }
  }
  double _progressValue = 0.0;
  int _areaSqMeters = 0;
  
  // SayaÃ§lar
  int _mainTimerSeconds = 3600; // 60 Dakika (Mola iÃ§in)
  int _wasteCooldownSeconds = 0; // 15 Dakika (AtÄ±k giriÅŸi iÃ§in)
  Timer? _mainTimer;
  Timer? _wasteCooldownTimer;
  
  List<String> _evidencePhotos = [];
  List<ImageAnalysisResult> _analysisResults = []; // Yeni ekle
  double _currentWeight = 0.0; // Yeni ekle
  bool _isAnalyzingEvidence = false; // Yeni ekle
  
  final _analysisService = ImageAnalysisService();
  final _picker = ImagePicker();
  final TextEditingController _joinCodeController = TextEditingController();
  final TextEditingController _groupNameController = TextEditingController();
  final TextEditingController _groupAreaController = TextEditingController();
  final TextEditingController _chatController = TextEditingController();

  @override
  void dispose() {
    _mainTimer?.cancel();
    _wasteCooldownTimer?.cancel();
    _joinCodeController.dispose();
    _groupNameController.dispose();
    _groupAreaController.dispose();
    _chatController.dispose();
    super.dispose();
  }

  // 60 DakikalÄ±k Ana Operasyon SayacÄ±
  void _startMainTimer() {
    _mainTimer?.cancel();
    _mainTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_operationStatus == 'cleaning' && _mainTimerSeconds > 0) {
        setState(() => _mainTimerSeconds--);
        if (_mainTimerSeconds == 0) {
          _showBreakRequest();
        }
      }
    });
  }

  // 15 DakikalÄ±k AtÄ±k GiriÅŸ Kilidi
  void _startWasteCooldown() {
    setState(() => _wasteCooldownSeconds = 900); // 15 dk = 900 sn
    _wasteCooldownTimer?.cancel();
    _wasteCooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_wasteCooldownSeconds > 0) {
        setState(() => _wasteCooldownSeconds--);
      } else {
        timer.cancel();
      }
    });
  }

  void _showBreakRequest() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(context.read<LanguageProvider>().translate('break_request_60min')),
        backgroundColor: Colors.orange,
        duration: const Duration(seconds: 10),
      )
    );
  }

  String _formatTime(int seconds) {
    int mins = seconds ~/ 60;
    int secs = seconds % 60;
    return "${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}";
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<User?>(context);
    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: Text(context.watch<LanguageProvider>().translate('group_management')), backgroundColor: AppTheme.primaryColor),
        body: Center(child: Text(context.watch<LanguageProvider>().translate('please_login'))),
      );
    }
    
    final firestoreService = Provider.of<FirestoreService>(context, listen: false);

    return StreamBuilder<List<DocumentSnapshot>>(
      stream: firestoreService.watchUserGroups(user.uid),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Scaffold(body: Center(child: Text("Hata: ${snapshot.error}")));
        }
        if (snapshot.connectionState == ConnectionState.waiting) {
           return Scaffold(appBar: AppBar(backgroundColor: AppTheme.primaryColor), body: const Center(child: CircularProgressIndicator()));
        }

        final groups = snapshot.data ?? [];
        
        // EÄŸer operasyonda isek ve hala o grubun Ã¼yesiysek
        DocumentSnapshot? activeGroup;
        bool isPending = false;
        if (_isInOperation && _selectedGroupId != null) {
          try {
            activeGroup = groups.firstWhere((g) => g.id == _selectedGroupId);
          } catch (_) {
            // HenÃ¼z listede yoksa (yeni oluÅŸturulduysa) veya listeden Ã§Ä±ktÄ±ysa
            isPending = true;
          }
        }

        return Scaffold(
          backgroundColor: const Color(0xFFF0F2F5),
          appBar: AppBar(
            title: Text(_isInOperation ? context.watch<LanguageProvider>().translate('active_operation') : context.watch<LanguageProvider>().translate('group_management'), style: const TextStyle(fontWeight: FontWeight.bold)),
            backgroundColor: AppTheme.primaryColor,
            elevation: 0,
            leading: _isInOperation ? IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => setState(() => _isInOperation = false)) : null,
          ),
          body: _isInOperation 
              ? (activeGroup != null 
                  ? _buildActiveOperationView(user, activeGroup) 
                  : (isPending 
                      ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const CircularProgressIndicator(), const SizedBox(height: 20), Text(context.watch<LanguageProvider>().translate('operation_center_loading'))] ))
                      : _buildGroupSelectionView(user, groups: groups)))
              : _buildGroupSelectionView(user, groups: groups),
        );
      }
    );
  }

  // --- ğŸ  1. GROUP SELECTION VIEW ---
  Widget _buildGroupSelectionView(User user, {required List<DocumentSnapshot> groups}) {
    final hasGroups = groups.isNotEmpty;
    final firestoreService = Provider.of<FirestoreService>(context, listen: false);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(context.watch<LanguageProvider>().translate('your_groups'), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
          const SizedBox(height: 15),
          
          if (hasGroups)
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: groups.length,
              itemBuilder: (context, index) => _buildActiveGroupCard(groups[index]),
            )
          else
            _buildNoGroupPlaceholder(),
          
          const SizedBox(height: 30),
          const Divider(),
          const SizedBox(height: 30),
          
          Text(context.watch<LanguageProvider>().translate('new_group_actions'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
          const SizedBox(height: 15),
          
          NeumorphicButton(
            onPressed: () => _showCreateGroupDialog(context, user),
            backgroundColor: AppTheme.primaryColor,
            child: Center(
              child: Text(context.watch<LanguageProvider>().translate('create_new_group'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
          
          const SizedBox(height: 20),
          
          NeumorphicCard(
            backgroundColor: Colors.white,
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Text(context.watch<LanguageProvider>().translate('have_code'), style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                const SizedBox(height: 15),
                TextField(
                  controller: _joinCodeController,
                  decoration: InputDecoration(
                    hintText: context.watch<LanguageProvider>().translate('enter_group_code'),
                    fillColor: Colors.grey[50],
                    filled: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 15),
                NeumorphicButton(
                  onPressed: () async {
                    if (_joinCodeController.text.isEmpty) return;
                    bool joined = await firestoreService.joinGroupByCode(_joinCodeController.text, user.uid);
                    if (joined) {
                      _joinCodeController.clear();
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.read<LanguageProvider>().translate('joined_group_success')), backgroundColor: Colors.green));
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.read<LanguageProvider>().translate('invalid_or_expired_code')), backgroundColor: Colors.red));
                    }
                  },
                  backgroundColor: AppTheme.secondaryColor,
                  child: Center(
                    child: Text(context.watch<LanguageProvider>().translate('join_group'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 30),
          FutureBuilder<DocumentSnapshot>(
            future: FirebaseFirestore.instance.collection('users').doc(user.uid).get(),
            builder: (context, userSnapshot) {
              final shortId = userSnapshot.hasData ? userSnapshot.data!['shortId'] : '...';
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: Colors.grey[200]!),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.badge_outlined, color: Colors.grey, size: 20),
                    const SizedBox(width: 10),
                    Text(
                      context.watch<LanguageProvider>().translate('your_volunteer_id'),
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                    Text(
                      shortId,
                      style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5, color: Colors.black87),
                    ),
                    const SizedBox(width: 10),
                    IconButton(
                      icon: const Icon(Icons.copy, size: 18),
                      onPressed: () {
                        // Copy to clipboard logic
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.read<LanguageProvider>().translate('id_copied'))));
                      },
                    ),
                  ],
                ),
              );
            }
          ),
        ],
      ),
    );
  }

  Widget _buildNoGroupPlaceholder() {
    return Container(
      height: 200,
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20)],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.groups_rounded, size: 80, color: AppTheme.primaryColor.withOpacity(0.2)),
          const SizedBox(height: 10),
          Text(context.watch<LanguageProvider>().translate('not_in_group_yet'), style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(context.watch<LanguageProvider>().translate('create_group_to_clean'), style: const TextStyle(fontSize: 12, color: Colors.grey)),
        ],
      ),
    ).animate().fadeIn().scale();
  }

  Widget _buildActiveGroupCard(DocumentSnapshot groupDoc) {
    final data = groupDoc.data() as Map<String, dynamic>;
    final name = data['name'] ?? context.watch<LanguageProvider>().translate('unnamed_group');
    final joinCode = data['joinCode'] ?? '';
    final membersCount = (data['members'] as List?)?.length ?? 1;
    final user = FirebaseAuth.instance.currentUser;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: NeumorphicCard(
        backgroundColor: Colors.white,
        padding: const EdgeInsets.all(20),
        onTap: () => setState(() {
          _selectedGroupId = groupDoc.id;
          _isInOperation = true;
        }),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: AppTheme.primaryColor.withOpacity(0.1), shape: BoxShape.circle),
                  child: const Icon(Icons.eco, color: Colors.green, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      Text("${context.watch<LanguageProvider>().translate('code')}: $joinCode • $membersCount ${context.watch<LanguageProvider>().translate('members')}", style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () async {
                    if (user != null) {
                      await FirestoreService().leaveGroup(groupDoc.id, user.uid);
                    }
                  },
                  child: Text(context.watch<LanguageProvider>().translate('leave'), style: const TextStyle(color: Colors.red, fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => setState(() {
                  _selectedGroupId = groupDoc.id;
                  _isInOperation = true;
                }),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: Text(context.watch<LanguageProvider>().translate('enter_operation'), style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    ).animate().slideX(begin: 0.1).fadeIn();
  }

  Widget _buildActiveOperationView(User user, DocumentSnapshot groupDoc) {
    final data = groupDoc.data() as Map<String, dynamic>;
    final isLeader = data['leaderId'] == user.uid;
    final status = data['status'] ?? 'ready';
    final progress = (data['progressValue'] ?? 0.0).toDouble();
    final memberIds = data['members'] as List<dynamic>? ?? [];
    final readyMembers = List<String>.from(data['readyMembers'] ?? []);
    final targetReportId = data['targetReportId'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(0),
      child: Column(
        children: [
          // Katılma İstekleri Paneli (Sadece lider görür)
          if (isLeader) _buildJoinRequestsPanel(groupDoc.id),

          // 📡 1. COMMAND MAP (RED TO GREEN)
          _buildCommandMap(progress),
          
          const SizedBox(height: 20),
          
          // 👥 2. HORIZONTAL MEMBERS LIST
          _buildHorizontalMembers(memberIds, readyMembers, status == 'cleaning'),
          
          const SizedBox(height: 20),

          // 🛑 HAZIR OLMA PANELİ
          if (status == 'ready') _buildReadyUpPanel(groupDoc.id, user.uid, readyMembers),
          
          const SizedBox(height: 20),
          
          // 💬 3. REAL-TIME CHAT PANEL
          _buildActiveChatPanel(groupDoc.id, user),
          
          const SizedBox(height: 24),
          
          // ⚖️ 4. WASTE & EVIDENCE CONTROL
          _buildWasteAndEvidenceControl(groupDoc.id, progress),
          
          const SizedBox(height: 24),
          
          // 🎮 5. LEADER CONTROLS
          if (isLeader) _buildLeaderCommandPanel(groupDoc.id, status, memberIds, readyMembers, targetReportId),
          
          const SizedBox(height: 24),

          // ⌛ 6. OPERATION TIMER
          _buildOperationTimer(),
          
          const SizedBox(height: 50),
        ],
      ),
    );
  }

  Widget _buildCommandMap(double progress) {
    return Container(
      height: 180,
      width: double.infinity,
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black87,
        borderRadius: BorderRadius.circular(25),
        boxShadow: [BoxShadow(color: Colors.green.withOpacity(0.2), blurRadius: 20)],
      ),
      child: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.3),
              borderRadius: BorderRadius.circular(25),
            ),
          ),
          AnimatedContainer(
            duration: 1.seconds,
            width: MediaQuery.of(context).size.width * progress,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.green.withOpacity(0.1), Colors.green.withOpacity(0.6)],
              ),
              borderRadius: BorderRadius.circular(25),
            ),
          ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 3.seconds),
          const Positioned.fill(child: Center(child: Icon(Icons.grid_4x4, color: Colors.white10, size: 200))),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.radar, color: Colors.white, size: 40).animate(onPlay: (c) => c.repeat()).rotate(),
                const SizedBox(height: 10),
                Text(
                  "${context.watch<LanguageProvider>().translate('operation_area')}: ${(progress * 100).toInt()}% ${context.watch<LanguageProvider>().translate('clean')}",
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 2),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHorizontalMembers(List<dynamic> memberIds, List<String> readyMembers, bool isCleaning) {
    return SizedBox(
      height: 110,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: memberIds.length + 1,
        itemBuilder: (context, index) {
          if (index == memberIds.length) {
            return GestureDetector(
              onTap: () => _showInviteDialog(""),
              child: Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Column(
                  children: [
                    Container(
                      width: 60, height: 60,
                      decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3), width: 2)),
                      child: const Icon(Icons.add, color: Colors.green, size: 30),
                    ),
                    const SizedBox(height: 8),
                    Text(context.watch<LanguageProvider>().translate('invite'), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            );
          }
          return FutureBuilder<DocumentSnapshot>(
            future: FirebaseFirestore.instance.collection('users').doc(memberIds[index]).get(),
            builder: (context, snapshot) {
              if (!snapshot.hasData) return const SizedBox(width: 80);
              final m = snapshot.data!.data() as Map<String, dynamic>;
              final isReady = readyMembers.contains(memberIds[index]);

              return Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Column(
                  children: [
                    Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        CircleAvatar(radius: 30, backgroundColor: Colors.white, child: Text(m['name'][0])),
                        Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                          child: Icon(
                            isCleaning
                                ? Icons.check_circle
                                : (isReady ? Icons.check_circle : Icons.hourglass_empty),
                            color: isCleaning
                                ? Colors.green
                                : (isReady ? Colors.green : Colors.orange),
                            size: 20,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(m['name'].split(' ')[0], style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
              );
            }
          );
        },
      ),
    );
  }

  Widget _buildActiveChatPanel(String groupId, User user) {
    return Container(
      height: 250,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(25),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15)],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                const Icon(Icons.forum_outlined, color: Colors.blue, size: 20),
                const SizedBox(width: 10),
                Text(context.watch<LanguageProvider>().translate('team_chat'), style: const TextStyle(fontWeight: FontWeight.bold)),
                const Spacer(),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: StreamBuilder<List<Map<String, dynamic>>>(
              stream: FirestoreService().watchGroupMessages(groupId),
              builder: (context, snapshot) {
                final msgs = snapshot.data ?? [];
                return ListView.builder(
                  reverse: true,
                  padding: const EdgeInsets.all(12),
                  itemCount: msgs.length,
                  itemBuilder: (context, index) {
                    final isMe = msgs[index]['senderId'] == user.uid;
                    return Align(
                      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(color: isMe ? Colors.green[100] : Colors.grey[100], borderRadius: BorderRadius.circular(15)),
                        child: Text(msgs[index]['text']),
                      ),
                    );
                  },
                );
              }
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(child: TextField(controller: _chatController, decoration: InputDecoration(hintText: context.watch<LanguageProvider>().translate('send_message'), border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none), filled: true, fillColor: Colors.grey[50]))),
                IconButton(onPressed: () async {
                  if (_chatController.text.isEmpty) return;
                  await FirestoreService().sendGroupMessage(groupId, user.uid, context.read<LanguageProvider>().translate('you'), _chatController.text);
                  _chatController.clear();
                }, icon: const Icon(Icons.send, color: Colors.blue)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWasteAndEvidenceControl(String groupId, double currentProgress) {
    return StatefulBuilder(
      builder: (context, setPanelState) => Container(
        padding: const EdgeInsets.all(20),
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(25)),
        child: Column(
          children: [
            Row(
              children: [
                const Icon(Icons.scale, color: Colors.orange),
                const SizedBox(width: 10),
                Text(context.watch<LanguageProvider>().translate('report_waste_gram'), style: const TextStyle(fontWeight: FontWeight.bold)),
                const Spacer(),
                if (_wasteCooldownSeconds > 0)
                  Text(_formatTime(_wasteCooldownSeconds), style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 15),
            Slider(
              value: _currentWeight.clamp(0, 5000),
              min: 0,
              max: 5000,
              divisions: 50,
              onChanged: _wasteCooldownSeconds > 0 ? null : (v) => setPanelState(() => _currentWeight = v),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("0gr", style: TextStyle(fontSize: 10)),
                Text("${_currentWeight.toInt()} gr", style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                const Text("5000gr", style: TextStyle(fontSize: 10)),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _wasteCooldownSeconds > 0 ? null : () async {
                      await FirebaseFirestore.instance.collection('groups').doc(groupId).update({
                        'progressValue': (currentProgress + 0.05).clamp(0, 1.0),
                      });
                      _startWasteCooldown();
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                    child: Text(context.watch<LanguageProvider>().translate('save')),
                  ),
                ),
                const SizedBox(width: 12),
                IconButton(onPressed: () => _captureEvidencePhoto(ImageSource.camera, groupId), icon: const Icon(Icons.add_a_photo, color: Colors.pink, size: 30)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLeaderCommandPanel(
    String groupId,
    String status,
    List<dynamic> memberIds,
    List<String> readyMembers,
    String? targetReportId,
  ) {
    final firestore = Provider.of<FirestoreService>(context, listen: false);
    final allReady = readyMembers.length == memberIds.length;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(25)),
      child: Column(
        children: [
          Text(context.watch<LanguageProvider>().translate('operation_management'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          
          if (status == 'ready') ...[
            Text(
              "Hazır Durumu: ${readyMembers.length}/${memberIds.length}",
              style: TextStyle(color: allReady ? Colors.green : Colors.orange, fontSize: 13, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: (!allReady || targetReportId == null)
                    ? null
                    : () => firestore.startCleanupOperation(groupId, targetReportId),
                icon: const Icon(Icons.play_arrow, color: Colors.white),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  disabledBackgroundColor: Colors.grey[700],
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                label: Text(
                  targetReportId == null
                      ? "Önce Rapor Seçin"
                      : (allReady ? "Temizliği Başlat" : "Üyelerin Hazır Olması Bekleniyor"),
                  style: TextStyle(
                    color: (!allReady || targetReportId == null) ? Colors.grey[400] : Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ] else if (status == 'cleaning') ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _commandBtn(Icons.pause, context.watch<LanguageProvider>().translate('break'), Colors.orange, () => firestore.updateGroupData(groupId, {'status': 'break'})),
                _commandBtn(Icons.stop, context.watch<LanguageProvider>().translate('finish'), Colors.red, () => _showFinishConfirmation(groupId)),
              ],
            ),
            const SizedBox(height: 16),
            if (targetReportId != null)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _showCancelConfirmation(groupId, targetReportId),
                  icon: const Icon(Icons.cancel, color: Colors.redAccent),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.redAccent),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  label: const Text("Temizlikten Vazgeç (İptal Et)", style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                ),
              ),
          ] else if (status == 'break') ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _commandBtn(Icons.play_arrow, context.watch<LanguageProvider>().translate('start'), Colors.green, () => firestore.updateGroupData(groupId, {'status': 'cleaning'})),
                _commandBtn(Icons.stop, context.watch<LanguageProvider>().translate('finish'), Colors.red, () => _showFinishConfirmation(groupId)),
              ],
            ),
          ]
        ],
      ),
    );
  }

  Widget _commandBtn(IconData icon, String label, Color color, VoidCallback onTap) {
    return Column(children: [
      GestureDetector(onTap: onTap, child: Container(padding: const EdgeInsets.all(15), decoration: BoxDecoration(color: color.withOpacity(0.2), shape: BoxShape.circle, border: Border.all(color: color)), child: Icon(icon, color: color))),
      const SizedBox(height: 8),
      Text(label, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
    ]);
  }

  Widget _buildOperationTimer() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(40), border: Border.all(color: Colors.orange.withOpacity(0.3))),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.timer_outlined, color: Colors.orange),
        const SizedBox(width: 12),
        Text("${context.watch<LanguageProvider>().translate('remaining_operation_time')}: ${_formatTime(_mainTimerSeconds)}", style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.orange)),
      ]),
    ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 2.seconds);
  }

  Future<void> _captureEvidencePhoto(ImageSource source, String groupId) async {
    try {
      final pickedFile = await _picker.pickImage(source: source, imageQuality: 70);
      if (pickedFile != null) {
        setState(() => _isAnalyzingEvidence = true);
        final bytes = await pickedFile.readAsBytes();
        final result = await _analysisService.analyzeImage(imageBytes: bytes, type: AnalysisType.cleanEvidence);
        setState(() {
          _isAnalyzingEvidence = false;
          if (result.isPhotoVerified) {
            _evidencePhotos.add(pickedFile.path);
            _analysisResults.add(result);
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result.isPhotoVerified ? context.read<LanguageProvider>().translate('evidence_accepted') : context.read<LanguageProvider>().translate('ai_rejected_image'))));
      }
    } catch (e) {
      setState(() => _isAnalyzingEvidence = false);
    }
  }

  void _showInviteDialog(String groupId) {
    final _inviteIdController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.read<LanguageProvider>().translate('invite_friend')),
        content: TextField(controller: _inviteIdController, decoration: const InputDecoration(hintText: "TMZ-XXXX")),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(context.read<LanguageProvider>().translate('cancel'))),
          ElevatedButton(onPressed: () async {
            await FirestoreService().sendGroupInvite(groupId, _inviteIdController.text, context.read<LanguageProvider>().translate('invite'));
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.read<LanguageProvider>().translate('invite_sent'))));
          }, child: Text(context.read<LanguageProvider>().translate('send'))),
        ],
      ),
    );
  }

  void _showFinishConfirmation(String groupId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.read<LanguageProvider>().translate('finish_operation')),
        content: Text(context.read<LanguageProvider>().translate('are_you_sure')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(context.read<LanguageProvider>().translate('cancel'))),
          ElevatedButton(onPressed: () {
            FirestoreService().updateGroupData(groupId, {'status': 'finished'});
            Navigator.pop(context);
            setState(() => _isInOperation = false);
          }, child: Text(context.read<LanguageProvider>().translate('finish_operation'))),
        ],
      ),
    );
  }

  void _showCreateGroupDialog(BuildContext context, User user) {
    // Ekran context'ini koru â€” dialog kapatÄ±ldÄ±ktan sonra setState iÃ§in gerekli
    final screenContext = context;
    
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(context.read<LanguageProvider>().translate('create_new_group')),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(
            controller: _groupNameController,
            decoration: InputDecoration(
              labelText: context.read<LanguageProvider>().translate('group_name'),
              hintText: "",
              prefixIcon: Icon(Icons.group),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _groupAreaController,
            decoration: InputDecoration(
              labelText: context.read<LanguageProvider>().translate('target_area'),
              hintText: "",
              prefixIcon: Icon(Icons.location_on),
            ),
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: Text(context.read<LanguageProvider>().translate('cancel'))),
          ElevatedButton(
            onPressed: () async {
              final groupName = _groupNameController.text.trim();
              final groupArea = _groupAreaController.text.trim();
              
              if (groupName.isEmpty) return;
              
              // Dialog'u kapat
              Navigator.pop(dialogContext);
              
              // Grup oluÅŸtur ve ID'yi al
              final newGroupId = await FirestoreService().createGroupWithCode(
                groupName, groupArea, user.uid
              );
              
              // Ekran context'i ile state gÃ¼ncelle (dialog context ile deÄŸil!)
              if (screenContext.mounted) {
                setState(() {
                  _selectedGroupId = newGroupId;
                  _isInOperation = true;
                });
                ScaffoldMessenger.of(screenContext).showSnackBar(
                  const SnackBar(
                    content: Text("ğŸ‰ Grup oluÅŸturuldu! Operasyon merkezine yÃ¶nlendiriliyor..."),
                    backgroundColor: Colors.green,
                    duration: Duration(seconds: 2),
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor, foregroundColor: Colors.white),
            child: Text(context.read<LanguageProvider>().translate('create')),
          ),
        ],
      ),
    );
  }

  Widget _buildReadyUpPanel(String groupId, String userId, List<String> readyMembers) {
    final isReady = readyMembers.contains(userId);
    final firestore = Provider.of<FirestoreService>(context, listen: false);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                isReady ? Icons.check_circle : Icons.hourglass_top_rounded,
                color: isReady ? Colors.green : Colors.orange,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  isReady ? "Hazırsınız! Operasyonun başlaması bekleniyor..." : "Operasyona katılmak için hazır olduğunuzu bildirin.",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isReady ? Colors.green : Colors.orange,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => firestore.toggleMemberReadyStatus(groupId, userId, !isReady),
              style: ElevatedButton.styleFrom(
                backgroundColor: isReady ? Colors.red[400] : Colors.green,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                isReady ? "Hazır Değilim Yap" : "Hazır Ol",
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJoinRequestsPanel(String groupId) {
    final firestore = Provider.of<FirestoreService>(context, listen: false);
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: firestore.watchGroupJoinRequests(groupId),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.isEmpty) return const SizedBox.shrink();
        final requests = snapshot.data!;
        
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.amber.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.amber.withOpacity(0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.person_add_alt_1, color: Colors.amber),
                  SizedBox(width: 8),
                  Text(
                    "Katılma İstekleri",
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: requests.length,
                itemBuilder: (context, index) {
                  final req = requests[index];
                  final userName = req['userName'] ?? 'Bilinmeyen';
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(userName, style: const TextStyle(fontWeight: FontWeight.w500)),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.check_circle, color: Colors.green),
                            onPressed: () => firestore.acceptGroupJoinRequest(req['id'], groupId, req['userId']),
                          ),
                          IconButton(
                            icon: const Icon(Icons.cancel, color: Colors.red),
                            onPressed: () => FirebaseFirestore.instance.collection('group_join_requests').doc(req['id']).delete(),
                          ),
                        ],
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
        );
      }
    );
  }

  void _showCancelConfirmation(String groupId, String reportId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Temizliği İptal Et"),
        content: const Text("Bu bölgedeki temizlik sürecini iptal etmek istediğinize emin misiniz? Bölge kilitleri açılacak ve diğer gruplara görünür olacaktır."),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Vazgeç"),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final firestore = Provider.of<FirestoreService>(context, listen: false);
              await firestore.cancelCleanupOperation(groupId, reportId);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text("Temizlik iptal edildi, bölge kilidi kaldırıldı."), backgroundColor: Colors.redAccent),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text("Evet, İptal Et"),
          ),
        ],
      ),
    );
  }
}
