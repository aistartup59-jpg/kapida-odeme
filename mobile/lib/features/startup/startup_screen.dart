import 'package:flutter/material.dart';

import 'startup_service.dart';

class StartupScreen extends StatefulWidget {
  const StartupScreen({super.key});

  @override
  State<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends State<StartupScreen> {
  String status = 'Checking backend...';

  @override
  void initState() {
    super.initState();
    _checkBackend();
  }

  Future<void> _checkBackend() async {
    final service = StartupService();
    final isConnected = await service.checkBackendConnection();

    if (!mounted) return;

    setState(() {
      status = isConnected ? 'Backend Connected' : 'Backend Unreachable';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Text(
          status,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
      ),
    );
  }
}
