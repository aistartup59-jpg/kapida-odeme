import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';

// A scripted HTTP layer, so the client's behaviour can be examined without a server. Dio takes
// the adapter as a seam of its own, which means nothing in lib/ needs a test-only branch.
class FakeHttp implements HttpClientAdapter {
  FakeHttp(this._script);

  // One entry per expected request, consumed in order. Running out is an assertion in itself:
  // it means the client sent more requests than the test allowed for.
  final List<FakeReply> _script;
  final List<RequestOptions> sent = <RequestOptions>[];

  int get requestCount => sent.length;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    sent.add(options);

    if (_script.isEmpty) {
      throw StateError('Unexpected request: ${options.method} ${options.path}');
    }

    final reply = _script.removeAt(0);
    final failure = reply.failure;

    if (failure != null) {
      throw DioException(requestOptions: options, type: failure);
    }

    return ResponseBody.fromString(
      jsonEncode(reply.body),
      reply.statusCode,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

class FakeReply {
  const FakeReply(this.statusCode, this.body) : failure = null;
  const FakeReply.failing(this.failure) : statusCode = 0, body = const {};

  final int statusCode;
  final Object body;
  final DioExceptionType? failure;
}

Dio dioBackedBy(FakeHttp http) => Dio()..httpClientAdapter = http;
