import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:payals_pos/core/api_client.dart';
import 'package:payals_pos/core/token_store.dart';

import 'support/fake_http.dart';
import 'support/fake_secure_storage.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(installFakeSecureStorage);

  group('error surfacing', () {
    test('shows the backend\'s own message rather than a status code', () async {
      final http = FakeHttp([const FakeReply(400, {'message': 'Transaction amount exceeds remaining balance.'})]);
      final client = ApiClient.handoff('hof_a_b', dio: dioBackedBy(http));

      await expectLater(
        client.post('/handoff/payment/transactions'),
        throwsA(isA<ApiException>()
            .having((e) => e.message, 'message', 'Transaction amount exceeds remaining balance.')
            .having((e) => e.statusCode, 'statusCode', 400)),
      );
    });

    test('joins the list of messages a validation failure returns', () async {
      // class-validator returns one entry per broken rule, and a courier shown "Instance of
      // List" learns nothing about what to correct.
      final http = FakeHttp([
        const FakeReply(400, {
          'message': ['amount must be a positive number', 'paymentMethod must be a string'],
        }),
      ]);
      final client = ApiClient.handoff('hof_a_b', dio: dioBackedBy(http));

      await expectLater(
        client.post('/handoff/payment/transactions'),
        throwsA(isA<ApiException>().having(
          (e) => e.message,
          'message',
          'amount must be a positive number, paymentMethod must be a string',
        )),
      );
    });

    test('surfaces a rate limit refusal as the server described it', () async {
      final http = FakeHttp([const FakeReply(429, {'message': 'ThrottlerException: Too Many Requests'})]);
      final client = ApiClient.handoff('hof_a_b', dio: dioBackedBy(http));

      await expectLater(
        client.get('/handoff/payment'),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', 429)),
      );
    });

    test('explains a network failure in terms of the connection, not of Dio', () async {
      final unreachable = FakeHttp([const FakeReply.failing(DioExceptionType.connectionError)]);
      final slow = FakeHttp([const FakeReply.failing(DioExceptionType.receiveTimeout)]);

      await expectLater(
        ApiClient.handoff('hof_a_b', dio: dioBackedBy(unreachable)).get('/handoff/payment'),
        throwsA(isA<ApiException>().having(
          (e) => e.message,
          'message',
          'Cannot reach the server. Check the connection and try again.',
        )),
      );
      await expectLater(
        ApiClient.handoff('hof_a_b', dio: dioBackedBy(slow)).get('/handoff/payment'),
        throwsA(isA<ApiException>().having((e) => e.message, 'message', 'The server took too long to respond.')),
      );
    });
  });

  group('hand-off client', () {
    test('authorises with the hand-off token and nothing else', () async {
      final http = FakeHttp([const FakeReply(200, {'id': 'p1'})]);
      await ApiClient.handoff('hof_public_secret', dio: dioBackedBy(http)).get('/handoff/payment');

      expect(http.sent.single.headers['X-Handoff-Token'], 'hof_public_secret');
      expect(http.sent.single.headers.containsKey('Authorization'), isFalse);
    });

    test('treats a 401 as final instead of retrying', () async {
      // The token is scoped to one payment request and cannot be refreshed (ADR-015). Retrying
      // would only spend the courier's time on a collection that is already over.
      final http = FakeHttp([const FakeReply(401, {'message': 'A valid hand-off token is required.'})]);

      await expectLater(
        ApiClient.handoff('hof_expired', dio: dioBackedBy(http)).get('/handoff/payment'),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', 401)),
      );
      expect(http.requestCount, 1);
    });
  });

  group('session client', () {
    Future<TokenStore> storeWith({String actorType = 'merchant'}) async {
      final store = TokenStore();
      await store.write(AuthTokens(accessToken: 'access-1', refreshToken: 'refresh-1', actorType: actorType));
      return store;
    }

    test('carries the stored access token', () async {
      final http = FakeHttp([const FakeReply(200, {'id': 'p1'})]);
      final client = ApiClient.session(await storeWith(), dio: dioBackedBy(http));

      await client.get('/payments/p1');

      expect(http.sent.single.headers['Authorization'], 'Bearer access-1');
    });

    test('refreshes once and replays the request the courier was in the middle of', () async {
      // A 15-minute access token will expire mid-collection. Dropping to the login screen at
      // that moment, with a customer waiting, is the failure this exists to prevent.
      final http = FakeHttp([
        const FakeReply(401, {'message': 'Unauthorized'}),
        const FakeReply(201, {'accessToken': 'access-2', 'refreshToken': 'refresh-2'}),
        const FakeReply(200, {'id': 'p1'}),
      ]);
      final store = await storeWith();
      final client = ApiClient.session(store, dio: dioBackedBy(http));

      await client.get('/payments/p1');

      expect(http.requestCount, 3);
      expect(http.sent[1].path, '/auth/refresh');
      expect(http.sent[2].headers['Authorization'], 'Bearer access-2');
      expect((await store.read())?.refreshToken, 'refresh-2');
    });

    test('refreshes an employee session through the employee endpoint', () async {
      // The two session kinds rotate through different endpoints, and the employee one is
      // itself authenticated — it rotates the session belonging to the presented token.
      final http = FakeHttp([
        const FakeReply(401, {'message': 'Unauthorized'}),
        const FakeReply(201, {'accessToken': 'access-2', 'refreshToken': 'refresh-2'}),
        const FakeReply(200, {'id': 'p1'}),
      ]);
      final client = ApiClient.session(await storeWith(actorType: 'employee'), dio: dioBackedBy(http));

      await client.get('/payments/p1');

      expect(http.sent[1].path, '/auth/employee/refresh');
      expect(http.sent[1].headers['Authorization'], 'Bearer access-1');
    });

    test('gives up after one refresh instead of looping', () async {
      final http = FakeHttp([
        const FakeReply(401, {'message': 'Unauthorized'}),
        const FakeReply(201, {'accessToken': 'access-2', 'refreshToken': 'refresh-2'}),
        const FakeReply(401, {'message': 'Unauthorized'}),
      ]);
      final client = ApiClient.session(await storeWith(), dio: dioBackedBy(http));

      await expectLater(
        client.get('/payments/p1'),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', 401)),
      );
      expect(http.requestCount, 3);
    });

    test('clears a session the server has stopped honouring', () async {
      // Keeping an unusable refresh token would leave the app looking signed in while every
      // request failed.
      final http = FakeHttp([
        const FakeReply(401, {'message': 'Unauthorized'}),
        const FakeReply(401, {'message': 'Invalid refresh token.'}),
      ]);
      final store = await storeWith();
      final client = ApiClient.session(store, dio: dioBackedBy(http));

      await expectLater(client.get('/payments/p1'), throwsA(isA<ApiException>()));
      expect(await store.read(), isNull);
    });

    test('sends no Authorization header when there is no session yet', () async {
      final http = FakeHttp([const FakeReply(201, {'accessToken': 'a', 'refreshToken': 'r'})]);
      final client = ApiClient.session(TokenStore(), dio: dioBackedBy(http));

      await client.post('/auth/merchant/login', body: {'email': 'a@b.c', 'password': 'x'});

      expect(http.sent.single.headers.containsKey('Authorization'), isFalse);
    });
  });

  group('TokenStore', () {
    test('round-trips a session', () async {
      final store = TokenStore();
      await store.write(const AuthTokens(accessToken: 'a', refreshToken: 'r', actorType: 'employee'));

      final read = await store.read();

      expect(read?.accessToken, 'a');
      expect(read?.refreshToken, 'r');
      expect(read?.actorType, 'employee');
    });

    test('reports no session when the stored one is incomplete', () async {
      // A half-written session is not a session. Treating it as one would send requests with a
      // token the app cannot refresh, and the app would never recover on its own.
      final values = installFakeSecureStorage();
      values['accessToken'] = 'a';

      expect(await TokenStore().read(), isNull);
    });

    test('leaves nothing behind after clear', () async {
      final store = TokenStore();
      await store.write(const AuthTokens(accessToken: 'a', refreshToken: 'r', actorType: 'merchant'));

      await store.clear();

      expect(await store.read(), isNull);
    });
  });
}
