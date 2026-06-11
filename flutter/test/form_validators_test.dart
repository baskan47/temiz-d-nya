import 'package:flutter_test/flutter_test.dart';
import 'package:purdunya_flutter_osm/form_validators.dart';

void main() {
  group('Form Validators - Email', () {
    test('valid email format accepted', () {
      expect(FormValidators.validateEmail('test@example.com'), isNull);
    });

    test('invalid email format rejected', () {
      expect(FormValidators.validateEmail('invalid-email'), isNotNull);
    });

    test('email without domain rejected', () {
      expect(FormValidators.validateEmail('test@'), isNotNull);
    });

    test('empty email rejected', () {
      expect(FormValidators.validateEmail(''), isNotNull);
    });

    test('email with spaces rejected', () {
      expect(FormValidators.validateEmail('test @example.com'), isNotNull);
    });

    test('multiple @ signs rejected', () {
      expect(FormValidators.validateEmail('test@@example.com'), isNotNull);
    });
  });

  group('Form Validators - Password', () {
    test('strong password accepted', () {
      expect(FormValidators.validatePassword('TestPass123!'), isNull);
    });

    test('weak password rejected', () {
      expect(FormValidators.validatePassword('weak'), isNotNull);
    });

    test('password without uppercase rejected', () {
      expect(FormValidators.validatePassword('testpass123'), isNotNull);
    });

    test('password without lowercase rejected', () {
      expect(FormValidators.validatePassword('TESTPASS123'), isNotNull);
    });

    test('password without number rejected', () {
      expect(FormValidators.validatePassword('TestPassword'), isNotNull);
    });

    test('too short password rejected', () {
      expect(FormValidators.validatePassword('Test1'), isNotNull);
    });

    test('empty password rejected', () {
      expect(FormValidators.validatePassword(''), isNotNull);
    });
  });

  group('Form Validators - Password Confirmation', () {
    test('matching passwords accepted', () {
      expect(
        FormValidators.validatePasswordConfirm('TestPass123!', 'TestPass123!'),
        isNull,
      );
    });

    test('non-matching passwords rejected', () {
      expect(
        FormValidators.validatePasswordConfirm('TestPass123!', 'DifferentPass123!'),
        isNotNull,
      );
    });

    test('empty confirmation rejected', () {
      expect(
        FormValidators.validatePasswordConfirm('TestPass123!', ''),
        isNotNull,
      );
    });
  });

  group('Form Validators - Phone', () {
    test('valid Turkish phone with + accepted', () {
      expect(FormValidators.validatePhone('+905551234567'), isNull);
    });

    test('valid Turkish phone without + accepted', () {
      expect(FormValidators.validatePhone('905551234567'), isNull);
    });

    test('too short phone rejected', () {
      expect(FormValidators.validatePhone('12345'), isNotNull);
    });

    test('phone with letters rejected', () {
      expect(FormValidators.validatePhone('abc1234567'), isNotNull);
    });

    test('empty phone rejected', () {
      expect(FormValidators.validatePhone(''), isNotNull);
    });

    test('invalid country code rejected', () {
      expect(FormValidators.validatePhone('+123456789'), isNotNull);
    });
  });

  group('Form Validators - Age', () {
    test('valid adult age accepted', () {
      expect(FormValidators.validateAge('25'), isNull);
    });

    test('minimum age boundary accepted', () {
      expect(FormValidators.validateAge('18'), isNull);
    });

    test('too young rejected', () {
      expect(FormValidators.validateAge('10'), isNotNull);
    });

    test('non-numeric age rejected', () {
      expect(FormValidators.validateAge('abc'), isNotNull);
    });

    test('empty age rejected', () {
      expect(FormValidators.validateAge(''), isNotNull);
    });

    test('negative age rejected', () {
      expect(FormValidators.validateAge('-5'), isNotNull);
    });
  });

  group('Form Validators - ID Number', () {
    test('valid 11-digit ID accepted', () {
      expect(FormValidators.validateIDNumber('12345678901'), isNull);
    });

    test('invalid length ID rejected', () {
      expect(FormValidators.validateIDNumber('123456789'), isNotNull);
    });

    test('ID with letters rejected', () {
      expect(FormValidators.validateIDNumber('1234567890A'), isNotNull);
    });

    test('empty ID rejected', () {
      expect(FormValidators.validateIDNumber(''), isNotNull);
    });

    test('ID starting with 0 rejected', () {
      expect(FormValidators.validateIDNumber('01234567890'), isNotNull);
    });
  });

  group('Form Validators - Name', () {
    test('valid name accepted', () {
      expect(FormValidators.validateName('John'), isNull);
    });

    test('empty name rejected', () {
      expect(FormValidators.validateName(''), isNotNull);
    });

    test('name with numbers accepted', () {
      expect(FormValidators.validateName('John123'), isNull);
    });

    test('very long name accepted', () {
      expect(FormValidators.validateName('VeryLongNameWithManyCharacters'), isNull);
    });

    test('single character name accepted', () {
      expect(FormValidators.validateName('J'), isNull);
    });
  });

  group('Form Validators - Surname', () {
    test('valid surname accepted', () {
      expect(FormValidators.validateSurname('Doe'), isNull);
    });

    test('empty surname rejected', () {
      expect(FormValidators.validateSurname(''), isNotNull);
    });

    test('surname with hyphen accepted', () {
      expect(FormValidators.validateSurname('Smith-Jones'), isNull);
    });
  });

  group('Form Validators - Area', () {
    test('valid area accepted', () {
      expect(FormValidators.validateArea('District 1'), isNull);
    });

    test('empty area rejected', () {
      expect(FormValidators.validateArea(''), isNotNull);
    });

    test('area with numbers accepted', () {
      expect(FormValidators.validateArea('Area 5B'), isNull);
    });
  });

  group('Form Validators - Weight', () {
    test('valid weight accepted', () {
      expect(FormValidators.validateWeight('5'), isNull);
    });

    test('zero weight rejected', () {
      expect(FormValidators.validateWeight('0'), isNotNull);
    });

    test('negative weight rejected', () {
      expect(FormValidators.validateWeight('-5'), isNotNull);
    });

    test('non-numeric weight rejected', () {
      expect(FormValidators.validateWeight('heavy'), isNotNull);
    });

    test('empty weight rejected', () {
      expect(FormValidators.validateWeight(''), isNotNull);
    });

    test('very large weight accepted', () {
      expect(FormValidators.validateWeight('10'), isNull);
    });
  });

  group('Form Validators - Group Name', () {
    test('valid group name accepted', () {
      expect(FormValidators.validateGroupName('Cleanup Squad'), isNull);
    });

    test('empty group name rejected', () {
      expect(FormValidators.validateGroupName(''), isNotNull);
    });

    test('special characters in name accepted', () {
      expect(FormValidators.validateGroupName('Team @2024'), isNull);
    });
  });

  group('Form Validators - Description', () {
    test('valid description accepted', () {
      expect(
        FormValidators.validateDescription('This is a valid description'),
        isNull,
      );
    });

    test('empty description rejected', () {
      expect(FormValidators.validateDescription(''), isNotNull);
    });

    test('very long description accepted', () {
      final longDesc = 'A' * 500;
      expect(FormValidators.validateDescription(longDesc), isNull);
    });

    test('description with newlines accepted', () {
      expect(
        FormValidators.validateDescription('Line 1\nLine 2\nLine 3'),
        isNull,
      );
    });
  });
}
