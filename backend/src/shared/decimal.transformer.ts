import { ValueTransformer } from 'typeorm';

// Postgres numeric/decimal columns are returned by the pg driver as strings (no OID 1700
// parser is registered, and TypeORM applies no automatic coercion for 'decimal' columns),
// so entity fields typed `number` (totalAmount, paidAmount, amount) would otherwise be
// strings at runtime whenever an entity is read back from the database.
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? value : parseFloat(value)),
};
