import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'features/startup/startup_screen.dart';

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    final router = GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const StartupScreen(),
        ),
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
