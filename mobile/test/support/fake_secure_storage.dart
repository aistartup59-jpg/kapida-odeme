import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

// flutter_secure_storage reaches the Android keystore over a method channel, which does not
// exist in a test process. This answers that channel from a plain map so TokenStore can be
// exercised as written, rather than being given a test-only alternative it would not use in
// production.
Map<String, String> installFakeSecureStorage() {
  const channel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
  final values = <String, String>{};

  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
    channel,
    (call) async {
      final arguments = (call.arguments as Map?)?.cast<String, dynamic>() ?? const {};
      final key = arguments['key'] as String?;

      switch (call.method) {
        case 'read':
          return values[key];
        case 'write':
          values[key!] = arguments['value'] as String;
          return null;
        case 'delete':
          values.remove(key);
          return null;
        case 'readAll':
          return Map<String, String>.from(values);
        case 'deleteAll':
          values.clear();
          return null;
        case 'containsKey':
          return values.containsKey(key);
        default:
          return null;
      }
    },
  );

  return values;
}
