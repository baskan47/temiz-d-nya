import 'package:flutter/material.dart';
import 'user_score.dart';

class MobileScoresScreen extends StatefulWidget {
  @override
  _MobileScoresScreenState createState() => _MobileScoresScreenState();
}

class _MobileScoresScreenState extends State<MobileScoresScreen> {
  double totalPoints = 1250;
  int completedTasks = 15;
  int groupsJoined = 3;
  String currentBadge = 'platinum';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Puanlarım')),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Puan Özeti Kartı
            Card(
              margin: EdgeInsets.all(16),
              elevation: 4,
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Column(
                  children: [
                    Text('${totalPoints.toInt()}', style: TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: Colors.green)),
                    Text('Toplam Eco Point', style: TextStyle(fontSize: 16, color: Colors.grey)),
                    SizedBox(height: 16),
                    Container(
                      padding: EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.amber[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('💎 Platinum Rozeti', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
            // İstatistikler
            Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('İstatistikler', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  SizedBox(height: 12),
                  _buildStatTile(Icons.done, 'Tamamlanan Görev', '$completedTasks', Colors.blue),
                  _buildStatTile(Icons.group, 'Katıldığı Grup', '$groupsJoined', Colors.purple),
                  _buildStatTile(Icons.trending_up, 'Bu Hafta Kazanılan', '+350 EP', Colors.green),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatTile(IconData icon, String title, String value, Color color) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12),
      child: Container(
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 28),
            SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: Colors.grey[600])),
                Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
