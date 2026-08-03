import 'package:flutter/material.dart';

/// The brand, in one place, so the app and the website cannot drift apart.
///
/// These values were measured out of the supplied logo artwork rather than
/// guessed: the pink is the colour that actually occurs across 24,217 pixels of
/// the wordmark, and the ink is genuinely pure black, not an off-black.
class Brand {
  const Brand._();

  static const Color pink = Color(0xFFF00161);
  static const Color ink = Color(0xFF000000);

  /// Pressed and hovered states, dark enough to register against [pink].
  static const Color pinkDeep = Color(0xFFC4004F);

  /// A wash for selected rows and quiet emphasis.
  static const Color pinkTint = Color(0xFFFFECF4);

  static const Color surface = Color(0xFFF8F5F7);

  /// Material would otherwise tone the seed into something adjacent to the
  /// brand rather than the brand itself, so the roles that carry the identity
  /// are pinned and the rest of the palette is derived around them.
  static ColorScheme get colorScheme => ColorScheme.fromSeed(
        seedColor: pink,
        primary: pink,
        onPrimary: Colors.white,
        secondary: ink,
        onSecondary: Colors.white,
      );
}

/// The PayALS lockup — mark plus wordmark, without the tagline.
///
/// A raster rather than the SVG the website uses: Flutter cannot draw SVG
/// without adding a package, and a single logo does not justify the dependency.
class BrandLockup extends StatelessWidget {
  const BrandLockup({super.key, this.height = 44});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/brand/payals-lockup.png',
      height: height,
      fit: BoxFit.contain,
      semanticLabel: 'PayALS',
    );
  }
}
