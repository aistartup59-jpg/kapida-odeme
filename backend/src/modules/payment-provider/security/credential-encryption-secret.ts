// Single source of truth for reading the credential-vault encryption secret. There is no
// default: a missing or blank CREDENTIAL_ENCRYPTION_SECRET must fail application startup
// immediately rather than silently encrypting vaulted credentials with a known value.
export function getRequiredCredentialEncryptionSecret(): string {
  const secret = process.env.CREDENTIAL_ENCRYPTION_SECRET;

  if (!secret || !secret.trim()) {
    throw new Error(
      'CREDENTIAL_ENCRYPTION_SECRET environment variable is required and has no default. ' +
        'Set it before starting the application.',
    );
  }

  return secret;
}
