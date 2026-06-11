import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'firestore_service.dart';
import 'theme.dart';
import 'translations.dart';
import 'language_provider.dart';
import 'group_management_screen.dart';

class ReportDetailScreen extends StatefulWidget {
  final Map<String, dynamic> report;

  const ReportDetailScreen({Key? key, required this.report}) : super(key: key);

  @override
  _ReportDetailScreenState createState() => _ReportDetailScreenState();
}

class _ReportDetailScreenState extends State<ReportDetailScreen> {
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isSendingComment = false;

  @override
  void dispose() {
    _commentController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _handleCleanButtonPressed(
    BuildContext context,
    FirestoreService firestoreService,
    String reportId,
    String reportDescription,
    String locale,
  ) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(Translations.get('please_login', locale))),
      );
      return;
    }

    // Kullanıcının üye olduğu grupları çek
    final userGroupsSnap = await FirebaseFirestore.instance
        .collection('groups')
        .where('members', arrayContains: user.uid)
        .get();

    if (!mounted) return;

    if (userGroupsSnap.docs.isEmpty) {
      // Grup yok! Dialog göster
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(Translations.get('group_management', locale)),
          content: Text(Translations.get('group_required_alert', locale)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(Translations.get('cancel', locale)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => GroupManagementScreen(),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
              child: Text(Translations.get('go_to_group_mgmt', locale)),
            ),
          ],
        ),
      );
    } else {
      final groups = userGroupsSnap.docs;
      if (groups.length == 1) {
        final groupId = groups.first.id;
        final groupName = groups.first.data()['name'] ?? 'İsimsiz Grup';
        
        await firestoreService.updateGroupTarget(groupId, reportId, reportDescription);
        
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Hedef belirlendi! $groupName operasyon merkezine yönlendiriliyorsunuz..."),
            backgroundColor: Colors.green,
          ),
        );
        
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => GroupManagementScreen(),
          ),
        );
      } else {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text("Grup Seçin"),
            content: SizedBox(
              width: double.maxFinite,
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: groups.length,
                itemBuilder: (context, index) {
                  final group = groups[index];
                  final groupName = group.data()['name'] ?? 'İsimsiz Grup';
                  return ListTile(
                    title: Text(groupName),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () async {
                      Navigator.pop(ctx);
                      await firestoreService.updateGroupTarget(group.id, reportId, reportDescription);
                      
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text("Hedef belirlendi! $groupName operasyon merkezine yönlendiriliyorsunuz..."),
                          backgroundColor: Colors.green,
                        ),
                      );
                      
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => GroupManagementScreen(),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        );
      }
    }
  }

  Future<void> _handleJoinRequestPressed(
    BuildContext context,
    FirestoreService firestoreService,
    String groupId,
    String locale,
  ) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final userName = user.displayName ?? user.email?.split('@').first ?? "Gönüllü";
    
    await firestoreService.sendGroupJoinRequest(groupId, user.uid, userName);
    
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(Translations.get('join_request_sent', locale)),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final reportId = widget.report['reportId'] ?? widget.report['id'] ?? '';
    final description = widget.report['description'] ?? 'Açıklama belirtilmemiş.';
    final status = widget.report['status'] ?? 'open';
    final double lat = (widget.report['latitude'] ?? widget.report['location']?['latitude'] ?? 0.0).toDouble();
    final double lon = (widget.report['longitude'] ?? widget.report['location']?['longitude'] ?? 0.0).toDouble();
    final firestoreService = Provider.of<FirestoreService>(context, listen: false);

    // Get images list (images or fallback to image)
    List<String> imageUrls = [];
    if (widget.report['images'] != null) {
      imageUrls = List<String>.from(widget.report['images']);
    } else if (widget.report['image'] != null && widget.report['image'].toString().isNotEmpty) {
      imageUrls = [widget.report['image'].toString()];
    }

    Color statusColor;
    String statusText;
    switch (status) {
      case 'cleaned':
        statusColor = Colors.green;
        statusText = "Temizlendi";
        break;
      case 'in_progress':
        statusColor = Colors.orange;
        statusText = "İşlemde";
        break;
      default:
        statusColor = Colors.red;
        statusText = "Açık Rapor";
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Rapor Detayı', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              controller: _scrollController,
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Resim Slider (PageView)
                  if (imageUrls.isNotEmpty)
                    Container(
                      height: 250,
                      color: Colors.grey[200],
                      child: PageView.builder(
                        itemCount: imageUrls.length,
                        physics: const BouncingScrollPhysics(),
                        itemBuilder: (context, index) {
                          return Image.network(
                            imageUrls[index],
                            fit: BoxFit.cover,
                            width: double.infinity,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return const Center(child: CircularProgressIndicator());
                            },
                            errorBuilder: (context, error, stackTrace) {
                              return const Center(
                                child: Icon(Icons.broken_image, size: 50, color: Colors.grey),
                              );
                            },
                          );
                        },
                      ),
                    )
                  else
                    Container(
                      height: 180,
                      color: Colors.grey[300],
                      width: double.infinity,
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.image_not_supported_outlined, size: 48, color: Colors.grey),
                          SizedBox(height: 8),
                          Text("Görsel Eklenmemiş", style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),

                  Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 2. Durum Badge & Konum Bilgisi
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: statusColor.withOpacity(0.3)),
                              ),
                              child: Text(
                                statusText,
                                style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                            ),
                            Text(
                              "GPS: ${lat.toStringAsFixed(4)}, ${lon.toStringAsFixed(4)}",
                              style: TextStyle(color: Colors.grey[600], fontSize: 13, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // 3. Açıklama Kartı
                        const Text(
                          "Açıklama",
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.black87),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))
                            ],
                          ),
                          child: Text(
                            description,
                            style: const TextStyle(fontSize: 15, height: 1.4, color: Colors.black87),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // ── Canlı Yorum Başlığı ──────────────────────────────
                        const Row(
                          children: [
                            Icon(Icons.comment_outlined, color: AppTheme.primaryColor),
                            SizedBox(width: 8),
                            Text(
                              "Canlı Yorumlar",
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.black87),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),

                  // 4. Canlı Yorum Listesi
                  if (reportId.isNotEmpty)
                    StreamBuilder<List<Map<String, dynamic>>>(
                      stream: firestoreService.watchComments(reportId),
                      builder: (context, snapshot) {
                        if (snapshot.hasError) {
                          return const Padding(
                            padding: EdgeInsets.all(20.0),
                            child: Text("Yorumlar yüklenirken bir hata oluştu."),
                          );
                        }
                        if (!snapshot.hasData) {
                          return const Center(child: Padding(
                            padding: EdgeInsets.all(20.0),
                            child: CircularProgressIndicator(),
                          ));
                        }

                        final comments = snapshot.data!;

                        if (comments.isEmpty) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
                            child: Text(
                              "Henüz yorum yapılmamış. İlk yorumu siz yazın!",
                              style: TextStyle(color: Colors.grey[600], fontStyle: FontStyle.italic),
                            ),
                          );
                        }

                        return ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          itemCount: comments.length,
                          itemBuilder: (context, index) {
                            final comment = comments[index];
                            final userName = comment['userName'] ?? 'Anonim';
                            final commentText = comment['commentText'] ?? '';
                            final timestamp = comment['timestamp'] as Timestamp?;
                            final timeString = timestamp != null
                                ? "${timestamp.toDate().hour.toString().padLeft(2, '0')}:${timestamp.toDate().minute.toString().padLeft(2, '0')}"
                                : "";

                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(color: Colors.black.withOpacity(0.01), blurRadius: 6, offset: const Offset(0, 2))
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        userName,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primaryColor),
                                      ),
                                      Text(
                                        timeString,
                                        style: TextStyle(color: Colors.grey[400], fontSize: 11),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    commentText,
                                    style: const TextStyle(fontSize: 14, color: Colors.black87),
                                  ),
                                ],
                              ),
                            ).animate().fadeIn(duration: 300.ms);
                          },
                        );
                      },
                    ),
                ],
              ),
            ),
          ),

          // Temizlik Kontrol Butonları
          FutureBuilder<DocumentSnapshot>(
            future: FirebaseFirestore.instance.collection('reports').doc(reportId).get(),
            builder: (context, reportSnap) {
              if (!reportSnap.hasData) return const SizedBox.shrink();
              final reportData = reportSnap.data!.data() as Map<String, dynamic>? ?? {};
              final rStatus = reportData['status'] ?? 'dirty';
              final rAreaSize = reportData['areaSize'] ?? 'small';
              final rCurrentGroupId = reportData['currentGroupId'];
              final langProvider = Provider.of<LanguageProvider>(context);
              final locale = langProvider.currentLanguage;

              if (rStatus == 'cleaned') {
                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  color: Colors.green.withOpacity(0.1),
                  child: Center(
                    child: Text(
                      Translations.get('cleaning_completed', locale),
                      style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ),
                );
              }

              if (rStatus == 'cleaning' || rStatus == 'in_progress') {
                if (rAreaSize == 'small') {
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border(top: BorderSide(color: Colors.grey[200]!)),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.lock, color: Colors.orange, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                Translations.get('area_is_locked', locale),
                                style: TextStyle(color: Colors.grey[800], fontSize: 12, fontWeight: FontWeight.w500),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        FutureBuilder<DocumentSnapshot>(
                          future: FirebaseFirestore.instance.collection('groups').doc(rCurrentGroupId).get(),
                          builder: (context, groupSnap) {
                            if (!groupSnap.hasData) return const SizedBox.shrink();
                            final groupData = groupSnap.data!.data() as Map<String, dynamic>? ?? {};
                            final members = List<String>.from(groupData['members'] ?? []);
                            final user = FirebaseAuth.instance.currentUser;
                            final isMember = user != null && members.contains(user.uid);

                            if (isMember) {
                              return SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => GroupManagementScreen(initialGroupId: rCurrentGroupId),
                                      ),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.orange,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  child: const Text("Operasyona Git", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                ),
                              );
                            }

                            return StreamBuilder<DocumentSnapshot>(
                              stream: FirebaseFirestore.instance.collection('group_join_requests').doc('${rCurrentGroupId}_${user?.uid}').snapshots(),
                              builder: (context, requestSnap) {
                                final hasRequest = requestSnap.hasData && requestSnap.data!.exists;
                                final reqStatus = hasRequest ? (requestSnap.data!.data() as Map<String, dynamic>)['status'] : null;

                                return SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: hasRequest ? null : () => _handleJoinRequestPressed(context, firestoreService, rCurrentGroupId, locale),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.primaryColor,
                                      disabledBackgroundColor: Colors.grey[300],
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    child: Text(
                                      hasRequest
                                          ? (reqStatus == 'accepted' ? "Katılım Onaylandı" : Translations.get('join_request_received', locale))
                                          : Translations.get('join_request_btn', locale),
                                      style: TextStyle(
                                        color: hasRequest ? Colors.grey[600] : Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                );
                              }
                            );
                          }
                        ),
                      ],
                    ),
                  );
                } else {
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border(top: BorderSide(color: Colors.grey[200]!)),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.blue.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.info, color: Colors.blue, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  Translations.get('large_area_alert', locale),
                                  style: const TextStyle(color: Colors.blue, fontSize: 12, fontWeight: FontWeight.w500),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () => _handleCleanButtonPressed(context, firestoreService, reportId, description, locale),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text(
                              Translations.get('clean_here', locale),
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }
              }

              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Colors.grey[200]!)),
                ),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _handleCleanButtonPressed(context, firestoreService, reportId, description, locale),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                      Translations.get('clean_here', locale),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ),
                ),
              );
            },
          ),

          // 5. Yorum Yazma Formu
          Container(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 12,
              bottom: MediaQuery.of(context).padding.bottom + 12,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -3))
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    decoration: InputDecoration(
                      hintText: "Bir yorum ekle...",
                      hintStyle: TextStyle(color: Colors.grey[400]),
                      filled: true,
                      fillColor: const Color(0xFFF1F3F5),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: AppTheme.primaryColor,
                  child: IconButton(
                    icon: _isSendingComment
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.send, color: Colors.white, size: 18),
                    onPressed: _isSendingComment ? null : () async {
                      final text = _commentController.text.trim();
                      if (text.isEmpty) return;

                      setState(() {
                        _isSendingComment = true;
                      });

                      try {
                        final user = FirebaseAuth.instance.currentUser;
                        final userName = user?.displayName ?? user?.email?.split('@').first ?? "Gönüllü";
                        await firestoreService.submitComment(
                          reportId: reportId,
                          userId: user?.uid ?? 'anonymous',
                          userName: userName,
                          commentText: text,
                        );
                        _commentController.clear();
                        // Scroll to bottom
                        Future.delayed(const Duration(milliseconds: 300), () {
                          if (_scrollController.hasClients) {
                            _scrollController.animateTo(
                              _scrollController.position.maxScrollExtent,
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeOut,
                            );
                          }
                        });
                      } catch (e) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text("Yorum gönderilemedi: $e")),
                        );
                      } finally {
                        setState(() {
                          _isSendingComment = false;
                        });
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
