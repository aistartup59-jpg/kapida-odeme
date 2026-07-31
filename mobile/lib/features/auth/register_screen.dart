import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/di.dart';
import '../../data/auth_repository.dart';

// Self-service onboarding for a small business. Order platform couriers never see this — they
// arrive on a hand-off link with no account at all (ADR-015).
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _businessName = TextEditingController();
  final _ownerFullName = TextEditingController();
  final _email = TextEditingController();
  final _phoneNumber = TextEditingController();
  final _password = TextEditingController();

  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _businessName.dispose();
    _ownerFullName.dispose();
    _email.dispose();
    _phoneNumber.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      // Registration signs the owner straight in, so a business that just onboarded can take
      // its first payment without a second trip through the login screen.
      await ref.read(authRepositoryProvider).register(
            MerchantRegistration(
              businessName: _businessName.text.trim(),
              ownerFullName: _ownerFullName.text.trim(),
              email: _email.text.trim(),
              phoneNumber: _phoneNumber.text.trim(),
              password: _password.text,
            ),
          );

      if (!mounted) return;
      Navigator.of(context).pushNamedAndRemoveUntil('/home', (route) => false);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String? _required(String? value, String label) {
    return (value == null || value.trim().isEmpty) ? '$label gerekli.' : null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('İşletme kaydı')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              TextFormField(
                controller: _businessName,
                enabled: !_busy,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(labelText: 'İşletme adı', border: OutlineInputBorder()),
                validator: (value) => _required(value, 'İşletme adı'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _ownerFullName,
                enabled: !_busy,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(labelText: 'Yetkili adı soyadı', border: OutlineInputBorder()),
                validator: (value) => _required(value, 'Yetkili adı'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _email,
                enabled: !_busy,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                decoration: const InputDecoration(labelText: 'E-posta', border: OutlineInputBorder()),
                validator: (value) {
                  final missing = _required(value, 'E-posta');
                  if (missing != null) return missing;
                  return value!.contains('@') ? null : 'Geçerli bir e-posta girin.';
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneNumber,
                enabled: !_busy,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Telefon', border: OutlineInputBorder()),
                validator: (value) => _required(value, 'Telefon'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _password,
                enabled: !_busy,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Şifre', border: OutlineInputBorder()),
                // Mirrors the backend's minimum, so a too-short password is caught here rather
                // than after a round trip.
                validator: (value) {
                  final missing = _required(value, 'Şifre');
                  if (missing != null) return missing;
                  return value!.length >= 8 ? null : 'Şifre en az 8 karakter olmalı.';
                },
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
                    : const Text('Kaydol ve başla'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
