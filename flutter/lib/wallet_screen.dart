import 'package:flutter/material.dart';

class WalletScreen extends StatelessWidget {
  final int points;

  const WalletScreen({Key? key, required this.points}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Eko-Cüzdan', style: TextStyle(color: Colors.black87)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _buildBalanceCard(),
            const SizedBox(height: 30),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                Text("Ödül Mağazası", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                Text("Tümünü Gör", style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 16),
            _buildRewardItem(
              title: "Ücretsiz Kahve",
              description: "Anlaşmalı yerel kafelerde geçerli.",
              cost: 500,
              icon: Icons.coffee,
              color: Colors.brown,
            ),
            const SizedBox(height: 12),
            _buildRewardItem(
              title: "Toplu Taşıma Bileti",
              description: "Şehir içi ulaşımda 1 biniş hakkı.",
              cost: 1000,
              icon: Icons.directions_bus,
              color: Colors.blue,
            ),
            const SizedBox(height: 12),
            _buildRewardItem(
              title: "Premium Profil Teması",
              description: "Profilini doğa renkleriyle süsle.",
              cost: 300,
              icon: Icons.palette,
              color: Colors.purple,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBalanceCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF2E7D32), Color(0xFF1B5E20)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text("Toplam Eko-Puan", style: TextStyle(color: Colors.white70, fontSize: 16)),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                points.toString(),
                style: const TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.bold),
              ),
              const Padding(
                padding: EdgeInsets.only(bottom: 8.0, left: 4),
                child: Text("EP", style: TextStyle(color: Colors.white70, fontSize: 20, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text("Puan Harca"),
            style: ElevatedButton.styleFrom(
              foregroundColor: Colors.green.shade800, backgroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildRewardItem({
    required String title,
    required String description,
    required int cost,
    required IconData icon,
    required Color color,
  }) {
    bool canAfford = points >= cost;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade200),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text(description, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
              ],
            ),
          ),
          Column(
            children: [
              Text("$cost EP", style: TextStyle(fontWeight: FontWeight.bold, color: canAfford ? Colors.green : Colors.red)),
              const SizedBox(height: 8),
              SizedBox(
                height: 30,
                child: ElevatedButton(
                  onPressed: canAfford ? () {} : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: canAfford ? Colors.green : Colors.grey.shade300,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text(canAfford ? "Al" : "Yetersiz", style: TextStyle(fontSize: 12)),
                ),
              )
            ],
          )
        ],
      ),
    );
  }
}
