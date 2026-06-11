import 'package:flutter/material.dart';

enum WasteType { evsel, plastik, tibbi, kimyasal, kesici }

extension WasteTypeExtension on WasteType {
  String get name {
    switch (this) {
      case WasteType.evsel: return "Evsel Atık";
      case WasteType.plastik: return "Plastik / Ambalaj";
      case WasteType.tibbi: return "Tıbbi Atık";
      case WasteType.kimyasal: return "Kimyasal / Toksik";
      case WasteType.kesici: return "Kesici / Delici";
    }
  }
  bool get isHazardous => this == WasteType.tibbi || this == WasteType.kimyasal || this == WasteType.kesici;
}

class WasteReportForm extends StatefulWidget {
  final VoidCallback onSubmit;

  const WasteReportForm({Key? key, required this.onSubmit}) : super(key: key);

  @override
  _WasteReportFormState createState() => _WasteReportFormState();
}

class _WasteReportFormState extends State<WasteReportForm> {
  WasteType _selectedType = WasteType.evsel;
  bool _privatePropertyChecked = false;
  bool _safetyChecked = false;

  void _onWasteTypeChanged(WasteType? type) {
    if (type == null) return;
    setState(() => _selectedType = type);

    if (type.isHazardous) {
      _showHazardousWarning();
    }
  }

  void _showHazardousWarning() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.red.shade900,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.report_problem, color: Colors.white, size: 36),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                "KESİNLİKLE MÜDAHALE ETMEYİN",
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ),
          ],
        ),
        content: const Text(
          "Seçtiğiniz atık türü yüksek hayati risk taşımaktadır. Lütfen atığa dokunmayın.\n\n"
          "Bu bildirim, bölgenin koordinatlarıyla birlikte doğrudan ilgili yerel belediye/valilik birimlerine acil durum koduyla iletilecektir.",
          style: TextStyle(color: Colors.white, fontSize: 16),
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() => _selectedType = WasteType.evsel); // Geri al
              Navigator.pop(context);
            },
            child: const Text("Vazgeç", style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.red.shade900),
            onPressed: () {
              Navigator.pop(context);
              // Burada B2G export / resmi kuruma bildirim servisi tetiklenecek
            },
            child: const Text("Kuruma Bildir"),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Kirlilik Bildir"), backgroundColor: Colors.green),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Atık Türü Seçin", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade400),
                borderRadius: BorderRadius.circular(8),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<WasteType>(
                  isExpanded: true,
                  value: _selectedType,
                  items: WasteType.values.map((type) => DropdownMenuItem(
                    value: type,
                    child: Text(
                      type.name, 
                      style: TextStyle(color: type.isHazardous ? Colors.red.shade700 : Colors.black87),
                    ),
                  )).toList(),
                  onChanged: _onWasteTypeChanged,
                ),
              ),
            ),
            
            const SizedBox(height: 30),
            const Text("Güvenlik Kontrolleri", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              activeColor: Colors.green,
              controlAffinity: ListTileControlAffinity.leading,
              title: const Text(
                "Bu bildirimin bulunduğu koordinat bir özel mülk veya şahıs arazisi sınırları içerisinde değildir. "
                "(Lütfen özel mülkiyet sınırlarına izinsiz girmeyiniz)",
                style: TextStyle(fontSize: 13),
              ),
              value: _privatePropertyChecked,
              onChanged: (val) => setState(() => _privatePropertyChecked = val ?? false),
            ),
            
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              activeColor: Colors.green,
              controlAffinity: ListTileControlAffinity.leading,
              title: const Text(
                "Bu alan fiziksel olarak güvenlidir (Aktif otoyol ortası, uçurum kenarı veya inşaat alanı değildir).",
                style: TextStyle(fontSize: 13),
              ),
              value: _safetyChecked,
              onChanged: (val) => setState(() => _safetyChecked = val ?? false),
            ),
            
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _selectedType.isHazardous ? Colors.red : Colors.green,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: (_privatePropertyChecked && _safetyChecked) ? widget.onSubmit : null,
                child: Text(
                  _selectedType.isHazardous ? "Yetkililere Acil Bildirim Gönder" : "Bildirimi Tamamla",
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
