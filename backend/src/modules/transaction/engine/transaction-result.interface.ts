export interface TransactionEngineError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface TransactionEngineResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: TransactionEngineError;
}
