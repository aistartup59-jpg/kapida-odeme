export interface PaymentExecutionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaymentExecutionResult {
  success: boolean;
  providerReference?: string;
  status?: string;
  error?: PaymentExecutionError;
}
