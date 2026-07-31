import '../core/api_client.dart';
import '../core/token_store.dart';

class MerchantRegistration {
  const MerchantRegistration({
    required this.businessName,
    required this.ownerFullName,
    required this.email,
    required this.phoneNumber,
    required this.password,
  });

  final String businessName;
  final String ownerFullName;
  final String email;
  final String phoneNumber;
  final String password;
}

class AuthRepository {
  AuthRepository(this._api, this._tokenStore);

  final ApiClient _api;
  final TokenStore _tokenStore;

  // Small businesses onboard themselves from the app. Order platform couriers never reach any
  // of this — they arrive through a hand-off token and never hold an account (ADR-015).
  Future<void> register(MerchantRegistration registration) async {
    await _api.post(
      '/auth/merchant/register',
      authorized: false,
      body: {
        'businessName': registration.businessName,
        'ownerFullName': registration.ownerFullName,
        'email': registration.email,
        'phoneNumber': registration.phoneNumber,
        'password': registration.password,
      },
    );

    await login(email: registration.email, password: registration.password, asEmployee: false);
  }

  // A business owner signs in as a merchant and sees every payment their merchant owns; staff
  // the owner invited sign in as employees. Which one it was has to be remembered, because the
  // two session kinds refresh through different endpoints.
  Future<void> login({required String email, required String password, required bool asEmployee}) async {
    final path = asEmployee ? '/auth/employee/login' : '/auth/merchant/login';
    final json = await _api.post(path, body: {'email': email, 'password': password}, authorized: false);

    final accessToken = json['accessToken'] as String?;
    final refreshToken = json['refreshToken'] as String?;

    if (accessToken == null || refreshToken == null) {
      throw ApiException('The server did not return a session.');
    }

    await _tokenStore.write(
      AuthTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
        actorType: asEmployee ? 'employee' : 'merchant',
      ),
    );
  }

  Future<bool> hasSession() async => await _tokenStore.read() != null;

  Future<void> logout() async {
    final tokens = await _tokenStore.read();

    // The local session is cleared even if the server call fails: leaving someone signed in on
    // a device they meant to sign out of is the worse outcome.
    if (tokens != null) {
      try {
        await _api.post(tokens.actorType == 'employee' ? '/auth/employee/logout' : '/auth/logout');
      } on ApiException {
        // Ignored on purpose — see above.
      }
    }

    await _tokenStore.clear();
  }
}
