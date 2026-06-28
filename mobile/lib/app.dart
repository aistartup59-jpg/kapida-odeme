import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    final router = GoRouter(
      routes: [
        // Feature routes will be added here.
      ],
    );

    return MaterialApp.router(
      title: 'Kapıda Ödeme',
      routerConfig: router,
      locale: const Locale('en'),
      supportedLocales: const [Locale('en')],
      localizationsDelegates: const [],
    );
  }
}
