import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purdunya_flutter_osm/auth_screen_improved.dart';

void main() {
  testWidgets('GlassmorphicCard renders child content successfully', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: GlassmorphicCard(
            child: Text('Test Content'),
          ),
        ),
      ),
    );

    expect(find.text('Test Content'), findsOneWidget);
  });
}
