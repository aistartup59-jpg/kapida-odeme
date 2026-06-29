import 'package:http/http.dart' as http;

import '../../core/app_config.dart';

class StartupService {
  Future<bool> checkBackendConnection() async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/health');

    try {
      final response = await http.get(uri).timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
