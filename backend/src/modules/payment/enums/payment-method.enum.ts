// Payments are accepted on the POS device only (ADR-013): a real Bank QR (ADR-003) shown
// by the device, an NFC card read by the device, or cash handed to the employee.
export enum PaymentMethod {
  QR = 'QR',
  NFC = 'NFC',
  CASH = 'CASH',
}
