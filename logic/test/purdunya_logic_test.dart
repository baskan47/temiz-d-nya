import 'package:test/test.dart';
import 'package:purdunya_logic/purdunya_logic.dart';

void main() {
  group('PurdunyaState', () {
    test('joinGroup increments participants and returns true on reaching max', () {
      final s = PurdunyaState(participants: 3);
      expect(s.joinGroup(), isFalse);
      expect(s.participants, 4);
      expect(s.joinGroup(), isTrue);
      expect(s.participants, 5);
      // further joins do nothing
      expect(s.joinGroup(), isFalse);
      expect(s.participants, 5);
    });

    test('startCleaning only starts when participants==5', () {
      final s = PurdunyaState(participants: 4);
      expect(s.startCleaning(), isFalse);
      s.participants = 5;
      expect(s.startCleaning(), isTrue);
      expect(s.isMissionActive, isTrue);
    });

    test('finishCleaning sets cleaned and adds eco points', () {
      final s = PurdunyaState(participants: 5);
      s.startCleaning();
      s.finishCleaning();
      expect(s.isMissionActive, isFalse);
      expect(s.isCleaned, isTrue);
      expect(s.ecoPoints, equals(PurdunyaState.finishPoints));
    });
  });
}
