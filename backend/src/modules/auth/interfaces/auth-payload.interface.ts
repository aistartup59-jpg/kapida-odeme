export interface AuthPayload {
  sub: string;
  type: 'merchant' | 'employee';
  merchantId?: string;
}
