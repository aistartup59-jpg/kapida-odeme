class AppConfig {
  // Supplied at build time (`--dart-define=API_BASE_URL=...`) rather than from a bundled .env
  // file: the APK is produced by a build command, and an env file that is git-ignored cannot
  // be relied on to exist when that command runs.
  //
  // The default targets a locally running backend from the Android emulator, which reaches the
  // host machine at 10.0.2.2 — localhost there resolves to the emulator itself.
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api',
  );

  // Scheme the order platform's app uses to hand a collection over to us (ADR-015).
  static const deepLinkScheme = 'kapidaodeme';
  static const deepLinkCollectHost = 'collect';
}
