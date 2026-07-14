// Single source of truth for reading the JWT signing/verification secret. There is no
// default: a missing or blank JWT_SECRET must fail application startup immediately rather
// than silently sign or verify tokens with a known value.
export function getRequiredJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || !secret.trim()) {
    throw new Error(
      'JWT_SECRET environment variable is required and has no default. ' +
        'Set it before starting the application.',
    );
  }

  return secret;
}
