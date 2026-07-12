import { PaymentMethod } from '../../payment/enums/payment-method.enum';
import { Transaction } from '../entities/transaction.entity';
import { TransactionEngineResult } from './transaction-result.interface';

export interface CreateTransactionEngineRequest {
  paymentRequestId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  providerReference?: string;
}

export interface TransactionEngine {
  createTransaction(request: CreateTransactionEngineRequest): Promise<TransactionEngineResult<Transaction>>;
  calculateRemainingAmount(paymentRequestId: string): Promise<TransactionEngineResult<number>>;
}
