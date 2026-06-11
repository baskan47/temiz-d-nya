import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'theme.dart';
import 'neomorphic_components.dart';

class NearbyOperationsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Yakınlardaki Operasyonlar",
          style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildActiveGroupCard(
            context,
            groupName: "Alanya Gönüllüleri",
            location: "Alanya Sahili",
            members: ["Baran", "Merve", "Can", "Selin"],
            progress: 0.75,
            startTime: "14:30",
          ),
          const SizedBox(height: 16),
          _buildActiveGroupCard(
            context,
            groupName: "Doğa Dostları",
            location: "Kemer Parkı",
            members: ["Ahmet", "Ayşe", "Mehmet"],
            progress: 0.40,
            startTime: "15:00",
          ),
          const SizedBox(height: 16),
          _buildActiveGroupCard(
            context,
            groupName: "Yeşil Gelecek",
            location: "Belek Ormanı",
            members: ["Ece", "Deniz"],
            progress: 0.90,
            startTime: "13:15",
          ),
        ],
      ),
    );
  }

  Widget _buildActiveGroupCard(
    BuildContext context, {
    required String groupName,
    required String location,
    required List<String> members,
    required double progress,
    required String startTime,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 15, offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(groupName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 14, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(location, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text("CANLI", style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 10)),
              ).animate(onPlay: (c) => c.repeat()).fadeOut(duration: 1.seconds, curve: Curves.easeInOut),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("İlerleme: %${(progress * 100).toInt()}", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(5),
                      child: LinearProgressIndicator(
                        value: progress,
                        backgroundColor: Colors.grey[200],
                        color: AppTheme.primaryColor,
                        minHeight: 8,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 30),
              Column(
                children: [
                  const Text("Başlangıç", style: TextStyle(fontSize: 10, color: Colors.grey)),
                  Text(startTime, style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              SizedBox(
                height: 30,
                width: 100,
                child: Stack(
                  children: List.generate(members.length > 3 ? 4 : members.length, (index) {
                    if (index == 3) {
                      return Positioned(
                        left: index * 20.0,
                        child: CircleAvatar(
                          radius: 15,
                          backgroundColor: Colors.grey[300],
                          child: Text("+${members.length - 3}", style: const TextStyle(fontSize: 10, color: Colors.black)),
                        ),
                      );
                    }
                    return Positioned(
                      left: index * 20.0,
                      child: CircleAvatar(
                        radius: 15,
                        backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                        child: Text(members[index][0], style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
                      ),
                    );
                  }),
                ),
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Gruba katılma isteği gönderildi!")));
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 8),
                ),
                child: const Text("Katıl", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
