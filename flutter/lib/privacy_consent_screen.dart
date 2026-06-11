import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'theme.dart';

/// KVKK / Gizlilik Politikası Aydınlatma Metni ekranı.
/// Kullanıcı "Onaylıyorum" butonuna basarsa Navigator.pop(true) döner.
/// İptal ederse Navigator.pop(false) döner.
class PrivacyConsentScreen extends StatefulWidget {
  const PrivacyConsentScreen({Key? key}) : super(key: key);

  @override
  State<PrivacyConsentScreen> createState() => _PrivacyConsentScreenState();
}

class _PrivacyConsentScreenState extends State<PrivacyConsentScreen> {
  bool _accepted = false;
  final ScrollController _scrollController = ScrollController();
  bool _hasScrolledToEnd = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (!_hasScrolledToEnd) {
      final max = _scrollController.position.maxScrollExtent;
      if (_scrollController.offset >= max - 80) {
        setState(() => _hasScrolledToEnd = true);
      }
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: const Text('Aydınlatma Metni ve KVKK'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context, false),
        ),
      ),
      body: Column(
        children: [
          // ── Bilgi Bandı ────────────────────────────────────────────────────
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: AppTheme.primaryColor.withOpacity(0.1),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: AppTheme.primaryColor, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Devam etmek için metni okuyun ve onaylayın.',
                    style: TextStyle(
                      color: AppTheme.primaryColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Metin İçeriği ─────────────────────────────────────────────────
          Expanded(
            child: SingleChildScrollView(
              controller: _scrollController,
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSection(
                    '🔒 KİŞİSEL VERİLERİN KORUNMASI HAKKINDA AYDINLATMA METNİ',
                    null,
                    isTitle: true,
                  ),
                  _buildSection('1. Veri Sorumlusu', '''
Temiz Dünya uygulaması ("Uygulama"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla faaliyet göstermektedir.'''),
                  _buildSection('2. İşlenen Kişisel Veriler', '''
Uygulama aracılığıyla aşağıdaki kişisel veriler toplanmaktadır:
• Ad, soyad ve profil fotoğrafı
• E-posta adresi ve telefon numarası
• Konum bilgisi (temizlik operasyonları için)
• Uygulama kullanım verileri ve anket yanıtları
• Cihaz bilgileri ve IP adresi'''),
                  _buildSection('3. Verilerin İşlenme Amacı', '''
Toplanan kişisel veriler şu amaçlarla işlenmektedir:
• Kullanıcı hesabının oluşturulması ve yönetilmesi
• Temizlik operasyonlarının koordinasyonu
• Puan sistemi ve liderlik tablosunun yönetimi
• Uygulama güvenliğinin sağlanması
• Yasal yükümlülüklerin yerine getirilmesi'''),
                  _buildSection('4. Verilerin Aktarılması', '''
Kişisel verileriniz; Google Firebase altyapısı üzerinde işlenmekte olup, yalnızca hizmetin sunulması için zorunlu olan üçüncü taraflarla (Google LLC) paylaşılmaktadır. Verileriniz yurt içinde ve yurt dışında (AB/EEA veya GDPR koruması sağlayan ülkelerde) güvenli olarak saklanmaktadır.'''),
                  _buildSection('5. Veri Saklama Süresi', '''
Kişisel verileriniz, hesabınızın aktif olduğu süre boyunca ve hesap silme talebinden itibaren 30 gün içinde silinmektedir. Yasal yükümlülükler kapsamındaki veriler mevzuatta belirlenen süreler boyunca saklanmaktadır.'''),
                  _buildSection('6. İlgili Kişinin Hakları', '''
KVKK\'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:
• Kişisel verilerinizin işlenip işlenmediğini öğrenme
• İşlenmişse buna ilişkin bilgi talep etme
• İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
• Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri öğrenme
• Eksik veya yanlış işlenmiş ise düzeltilmesini isteme
• Verilerinizin silinmesini veya yok edilmesini talep etme'''),
                  _buildSection('7. Çerezler ve Analitik', '''
Uygulama, Firebase Analytics aracılığıyla anonimleştirilmiş kullanım verisi toplamaktadır. Bu veriler sizinle ilişkilendirilmeden genel kullanım istatistikleri için kullanılmaktadır.'''),
                  _buildSection('8. İletişim', '''
Kişisel verilerinizle ilgili başvurularınız için:
📧 privacy@temiz-dunya.app

Bu metin en son güncelleme tarihinde geçerlidir. Değişiklikler uygulama üzerinden bildirilecektir.'''),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.07),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.primaryColor.withOpacity(0.2)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.verified_outlined, color: AppTheme.primaryColor, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Son güncelleme: Nisan 2026 · Versiyon 1.0',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.primaryColor,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),

          // ── Onay Bölümü ───────────────────────────────────────────────────
          _buildConsentFooter(),
        ],
      ),
    );
  }

  Widget _buildSection(String title, String? content, {bool isTitle = false}) {
    return Padding(
      padding: EdgeInsets.only(bottom: isTitle ? 20 : 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: isTitle ? 16 : 14,
              fontWeight: FontWeight.bold,
              color: isTitle ? AppTheme.primaryColor : const Color(0xFF2D3E50),
              height: 1.4,
            ),
          ),
          if (content != null) ...[
            const SizedBox(height: 8),
            Text(
              content,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF525C73),
                height: 1.6,
              ),
            ),
          ],
          if (!isTitle) const Padding(
            padding: EdgeInsets.only(top: 14),
            child: Divider(height: 1, color: Color(0xFFE8ECF0)),
          ),
        ],
      ),
    );
  }

  Widget _buildConsentFooter() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Onay checkbox
          InkWell(
            onTap: () => setState(() => _accepted = !_accepted),
            borderRadius: BorderRadius.circular(10),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
              child: Row(
                children: [
                  AnimatedContainer(
                    duration: 200.ms,
                    width: 24, height: 24,
                    decoration: BoxDecoration(
                      color: _accepted ? AppTheme.primaryColor : Colors.transparent,
                      border: Border.all(
                        color: _accepted ? AppTheme.primaryColor : Colors.grey[400]!,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: _accepted
                        ? const Icon(Icons.check, color: Colors.white, size: 16)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        style: TextStyle(
                          fontSize: 13, color: Colors.grey[700], height: 1.4,
                        ),
                        children: [
                          const TextSpan(text: 'Yukarıdaki '),
                          TextSpan(
                            text: 'Aydınlatma Metnini',
                            style: TextStyle(
                              color: AppTheme.primaryColor,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const TextSpan(
                            text: ' okudum ve kişisel verilerimin işlenmesini kabul ediyorum.',
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          // Onay Butonu
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _accepted ? () => Navigator.pop(context, true) : null,
              icon: const Icon(Icons.check_circle_outline),
              label: const Text(
                'Onaylıyorum ve Devam Et',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                disabledBackgroundColor: Colors.grey[200],
                disabledForegroundColor: Colors.grey[400],
              ),
            ),
          ),
          const SizedBox(height: 8),
          // Reddet
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Onaylamıyorum',
              style: TextStyle(color: Colors.grey[500], fontSize: 13),
            ),
          ),
        ],
      ),
    ).animate().slideY(begin: 1, end: 0, duration: 400.ms, curve: Curves.easeOut);
  }
}
