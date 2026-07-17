// Single source of truth for reading the database password. There is no default: a missing
// or blank DATABASE_PASSWORD must fail application startup immediately rather than silently
// connecting to the database with a known value.
export function getRequiredDatabasePassword(): string {
  const password = process.env.DATABASE_PASSWORD;

  if (!password || !password.trim()) {
    throw new Error(
      'DATABASE_PASSWORD environment variable is required and has no default. ' +
        'Set it before starting the application.',
    );
  }

  return password;
}
