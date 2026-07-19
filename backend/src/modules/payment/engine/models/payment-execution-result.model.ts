export interface PaymentExecutionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaymentExecutionResult {
  success: boolean;
  providerReference?: string;
  status?: string;
  qrData?: string;
  qrExpiresAt?: Date;
  linkUrl?: string;
  linkExpiresAt?: Date;
  error?: PaymentExecutionError;
}
