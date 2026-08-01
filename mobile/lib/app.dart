import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/di.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/register_screen.dart';
import 'features/collect/collect_screen.dart';
import 'features/home/home_screen.dart';
import 'features/startup/startup_screen.dart';

class App extends ConsumerWidget {
  const App({super.key});

  // A hand-off can arrive at any moment, on any screen — the courier finishes one order and
  // the platform immediately hands over the next. The activity is singleTop, so that second
  // link is delivered to the running instance rather than starting a fresh one, and a
  // listener attached to a single screen would simply not be there to hear it. Watching at
  // the root, and navigating through this key, means it is handled wherever the app happens
  // to be.
  static final navigatorKey = GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(incomingHandoffProvider, (_, next) {
      final handoff = next.valueOrNull;
      final navigatorContext = navigatorKey.currentContext;

      if (handoff != null && navigatorContext != null) {
        openHandoff(navigatorContext, handoff);
      }
    });

    return MaterialApp(
      title: 'PayALS',
      navigatorKey: navigatorKey,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0E7C66)),
        useMaterial3: true,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const StartupScreen(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/home': (context) => const HomeScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name != '/collect') {
          return null;
        }

        final arguments = settings.arguments;
        if (arguments is! CollectArguments) {
          return null;
        }

        return MaterialPageRoute(builder: (context) => CollectScreen(arguments: arguments));
      },
    );
  }
}
