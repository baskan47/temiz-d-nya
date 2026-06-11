import 'package:flutter/material.dart';
import 'translations.dart';

class LanguageProvider extends ChangeNotifier {
  String _currentLanguage = 'tr';

  String get currentLanguage => _currentLanguage;

  void setLanguage(String lang) {
    if (_currentLanguage != lang) {
      _currentLanguage = lang;
      notifyListeners();
    }
  }

  String translate(String key) {
    return Translations.get(key, _currentLanguage);
  }
}
