export interface ProviderError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
