import 'package:flutter/material.dart';

import 'features/auth/login_screen.dart';
import 'features/auth/register_screen.dart';
import 'features/collect/collect_screen.dart';
import 'features/home/home_screen.dart';
import 'features/startup/startup_screen.dart';

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kapıda Ödeme',
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
