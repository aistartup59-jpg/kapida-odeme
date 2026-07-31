import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthTokens {
  const AuthTokens({required this.accessToken, required this.refreshToken, required this.actorType});

  final String accessToken;
  final String refreshToken;

  // 'employee' or 'merchant'. The backend refreshes the two through different endpoints, so
  // the app has to remember which kind of session it is holding.
  final String actorType;
}

// Session tokens live in the platform keystore rather than shared preferences: this app
// authorises money movement, and a rooted-device dump of plain preferences would hand over a
// working session.
class TokenStore {
  TokenStore({FlutterSecureStorage? storage}) : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _accessKey = 'accessToken';
  static const _refreshKey = 'refreshToken';
  static const _actorKey = 'actorType';

  Future<AuthTokens?> read() async {
    final accessToken = await _storage.read(key: _accessKey);
    final refreshToken = await _storage.read(key: _refreshKey);
    final actorType = await _storage.read(key: _actorKey);

    if (accessToken == null || refreshToken == null || actorType == null) {
      return null;
    }

    return AuthTokens(accessToken: accessToken, refreshToken: refreshToken, actorType: actorType);
  }

  Future<void> write(AuthTokens tokens) async {
    await _storage.write(key: _accessKey, value: tokens.accessToken);
    await _storage.write(key: _refreshKey, value: tokens.refreshToken);
    await _storage.write(key: _actorKey, value: tokens.actorType);
  }

  Future<void> clear() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
    await _storage.delete(key: _actorKey);
  }
}
