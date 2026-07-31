import 'package:dio/dio.dart';

import 'app_config.dart';
import 'token_store.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

// Single HTTP entry point. How a request is authenticated is injected rather than baked in,
// because the app serves two callers with nothing in common: a signed-in merchant or employee
// carrying a JWT, and a courier delivering for an order platform who has no account at all and
// carries only a hand-off token (ADR-015).
class ApiClient {
  ApiClient({required Future<Map<String, String>?> Function() headers, Future<bool> Function()? onUnauthorized, Dio? dio})
      : _headers = headers,
        _onUnauthorized = onUnauthorized,
        _dio = dio ?? Dio() {
    _dio.options
      ..baseUrl = AppConfig.apiBaseUrl
      ..connectTimeout = const Duration(seconds: 15)
      ..receiveTimeout = const Duration(seconds: 20)
      // 4xx bodies carry the backend's error message, so they must reach the caller rather
      // than being turned into a bare DioException.
      ..validateStatus = (status) => status != null && status < 500;
  }

  // Session-authenticated client. On a 401 it refreshes once and replays the request: a
  // courier standing at a door must not be dropped back to the login screen just because a
  // 15-minute access token expired mid-collection.
  factory ApiClient.session(TokenStore tokenStore, {Dio? dio}) {
    late ApiClient client;

    client = ApiClient(
      dio: dio,
      headers: () async {
        final tokens = await tokenStore.read();
        return tokens == null ? null : {'Authorization': 'Bearer ${tokens.accessToken}'};
      },
      onUnauthorized: () => client._refreshSession(tokenStore),
    );

    return client;
  }

  // Hand-off client. The token is scoped to one payment request and cannot be refreshed — when
  // it expires the collection is over, so a 401 is final rather than something to retry.
  factory ApiClient.handoff(String handoffToken, {Dio? dio}) {
    return ApiClient(dio: dio, headers: () async => {'X-Handoff-Token': handoffToken});
  }

  final Dio _dio;
  final Future<Map<String, String>?> Function() _headers;
  final Future<bool> Function()? _onUnauthorized;

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? query}) =>
      _sendObject(() async => _dio.get(path, queryParameters: query, options: await _options()));

  Future<Map<String, dynamic>> post(String path, {Object? body, bool authorized = true}) => _sendObject(
        () async => _dio.post(path, data: body, options: authorized ? await _options() : null),
      );

  Future<List<dynamic>> getList(String path, {Map<String, dynamic>? query}) async {
    final response = await _send(() async => _dio.get(path, queryParameters: query, options: await _options()));
    return response.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> _sendObject(Future<Response<dynamic>> Function() request) async {
    final response = await _send(request);
    final data = response.data;
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  Future<Response<dynamic>> _send(Future<Response<dynamic>> Function() request) async {
    var response = await _perform(request);
    final onUnauthorized = _onUnauthorized;

    if (response.statusCode == 401 && onUnauthorized != null && await onUnauthorized()) {
      response = await _perform(request);
    }

    _throwIfError(response);
    return response;
  }

  Future<Response<dynamic>> _perform(Future<Response<dynamic>> Function() request) async {
    try {
      return await request();
    } on DioException catch (error) {
      throw ApiException(_networkMessage(error));
    }
  }

  Future<bool> _refreshSession(TokenStore tokenStore) async {
    final tokens = await tokenStore.read();
    if (tokens == null) {
      return false;
    }

    // Employee and merchant sessions refresh through separate endpoints, and the employee one
    // is itself authenticated — it rotates the session belonging to the presented token.
    final isEmployee = tokens.actorType == 'employee';
    final path = isEmployee ? '/auth/employee/refresh' : '/auth/refresh';

    try {
      final response = await _dio.post(
        path,
        data: {'refreshToken': tokens.refreshToken},
        options: isEmployee ? Options(headers: {'Authorization': 'Bearer ${tokens.accessToken}'}) : null,
      );

      final data = response.data;
      if (response.statusCode == null || response.statusCode! >= 400 || data is! Map) {
        await tokenStore.clear();
        return false;
      }

      await tokenStore.write(
        AuthTokens(
          accessToken: data['accessToken'] as String,
          refreshToken: data['refreshToken'] as String,
          actorType: tokens.actorType,
        ),
      );
      return true;
    } on DioException {
      return false;
    }
  }

  Future<Options?> _options() async {
    final headers = await _headers();
    return headers == null ? null : Options(headers: headers);
  }

  void _throwIfError(Response<dynamic> response) {
    final status = response.statusCode ?? 0;
    if (status < 400) {
      return;
    }

    final data = response.data;
    var message = 'Request failed ($status).';

    if (data is Map && data['message'] != null) {
      final raw = data['message'];
      message = raw is List ? raw.join(', ') : raw.toString();
    }

    throw ApiException(message, statusCode: status);
  }

  String _networkMessage(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return 'The server took too long to respond.';
      case DioExceptionType.connectionError:
        return 'Cannot reach the server. Check the connection and try again.';
      default:
        return error.message ?? 'Network error.';
    }
  }
}
