import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/di.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key, this.redirectTo});

  // Where to go once signed in. A hand-off that arrives while signed out lands here first, so
  // the courier is returned to the collection instead of a generic home screen.
  final String? redirectTo;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _asEmployee = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      await ref.read(authRepositoryProvider).login(
            email: _email.text.trim(),
            password: _password.text,
            asEmployee: _asEmployee,
          );

      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed(widget.redirectTo ?? '/home');
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Kapıda Ödeme', style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 4),
                Text('Kapıda tahsilat', style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: 32),
                // Only the business side signs in. An order platform's courier never lands
                // here — they arrive on a hand-off link and collect without an account.
                SegmentedButton<bool>(
                  segments: const [
                    ButtonSegment(value: false, label: Text('İşletme')),
                    ButtonSegment(value: true, label: Text('Personel')),
                  ],
                  selected: {_asEmployee},
                  onSelectionChanged: _busy ? null : (value) => setState(() => _asEmployee = value.first),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: _email,
                  enabled: !_busy,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  decoration: const InputDecoration(labelText: 'E-posta', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _password,
                  enabled: !_busy,
                  obscureText: true,
                  onSubmitted: (_) => _submit(),
                  decoration: const InputDecoration(labelText: 'Şifre', border: OutlineInputBorder()),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Giriş yap'),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _busy ? null : () => Navigator.of(context).pushNamed('/register'),
                  child: const Text('İşletmen yok mu? Kaydol'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
