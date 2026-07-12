export interface PaymentEngineError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaymentEngineResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: PaymentEngineError;
}
