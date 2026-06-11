import 'package:flutter/material.dart';

class LiabilityWaiverDialog extends StatefulWidget {
  final VoidCallback onAccepted;

  const LiabilityWaiverDialog({Key? key, required this.onAccepted}) : super(key: key);

  @override
  _LiabilityWaiverDialogState createState() => _LiabilityWaiverDialogState();
}

class _LiabilityWaiverDialogState extends State<LiabilityWaiverDialog> {
  bool _is18Plus = false;
  bool _liabilityAccepted = false;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: const [
          Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
          SizedBox(width: 8),
          Text("Güvenlik ve Onay"),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Lütfen temizlik faaliyetine başlamadan önce aşağıdaki yasal şartları okuyup onaylayın.",
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: const Text(
                "Temizlik faaliyetleri sırasındaki fiziksel yaralanma, "
                "kaza, yabani hayvan tehlikesi veya üçüncü şahıslara verilen "
                "maddi/manevi zararlardan Temiz Dünya platformu sorumlu değildir. "
                "Sahadaki tüm sorumluluk kullanıcının kendisine aittir.",
                style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic),
              ),
            ),
            const SizedBox(height: 16),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: const Text("18 yaşından büyük olduğumu veya ebeveyn denetiminde olduğumu kabul ediyorum.", style: TextStyle(fontSize: 13)),
              value: _is18Plus,
              onChanged: (val) => setState(() => _is18Plus = val ?? false),
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: const Text("Yukarıdaki sorumluluk reddi beyanını okudum ve kabul ediyorum.", style: TextStyle(fontSize: 13)),
              value: _liabilityAccepted,
              onChanged: (val) => setState(() => _liabilityAccepted = val ?? false),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text("İptal", style: TextStyle(color: Colors.grey)),
        ),
        ElevatedButton(
          onPressed: (_is18Plus && _liabilityAccepted) ? () {
            Navigator.pop(context);
            widget.onAccepted();
          } : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.green,
            disabledBackgroundColor: Colors.grey.shade300,
          ),
          child: const Text("Kabul Et ve Başla"),
        )
      ],
    );
  }
}

void showLiabilityWaiver(BuildContext context, VoidCallback onAccepted) {
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => LiabilityWaiverDialog(onAccepted: onAccepted),
  );
}
