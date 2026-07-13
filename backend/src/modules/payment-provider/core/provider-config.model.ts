export interface ProviderConfig {
  mode: 'TEST' | 'PRODUCTION';
  [key: string]: unknown;
}
