import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Employee } from '../auth/entities/employee.entity';
import { Merchant } from '../auth/entities/merchant.entity';
import { PaymentEngineService } from './engine/payment-engine.service';
import { PaymentRequest } from './entities/payment-request.entity';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { CreateTransactionRequestDto } from './dto/create-transaction-request.dto';
import { ListPaymentRequestsQueryDto } from './dto/list-payment-requests-query.dto';
import { PaymentRequestResponseDto } from './dto/payment-request-response.dto';
import { Currency } from './enums/currency.enum';
import { PaymentLifecycleState } from './enums/payment-lifecycle-state.enum';
import { PaymentMethod } from './enums/payment-method.enum';

interface ResolvedIdentity {
  merchant: Merchant;
  employee: Employee | null;
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
    private readonly paymentEngine: PaymentEngineService,
  ) {}

  async createPaymentRequest(
    payload: CreatePaymentRequestDto,
    user?: { sub?: string; type?: string },
  ): Promise<PaymentRequestResponseDto> {
    if (!payload?.totalAmount || payload.totalAmount <= 0) {
      throw new BadRequestException('totalAmount must be greater than 0.');
    }

    if (!payload?.paymentMethod?.trim()) {
      throw new BadRequestException('paymentMethod is required.');
    }

    const { merchant, employee } = await this.resolveIdentity(user);

    // No externalOrderId here: that belongs to a payment opened by an order platform, and a
    // signed-in caller keying an amount in has no platform order behind it (ADR-009, ADR-015).
    const result = await this.paymentEngine.createPayment({
      merchantId: merchant.id,
      employeeId: employee?.id ?? null,
      totalAmount: payload.totalAmount,
      currency: this.normalizeCurrency(payload.currency),
      paymentMethod: this.normalizePaymentMethod(payload.paymentMethod),
      description: payload.description?.trim() || undefined,
      expiresAt: this.normalizeExpiresAt(payload.expiresAt),
    });

    if (!result.success || !result.data) {
      throw new BadRequestException(result.error?.message ?? 'Unable to create payment request.');
    }

    const response = await this.toResponse(result.data);

    if (result.qrData) {
      response.qrData = result.qrData;
      response.qrExpiresAt = result.qrExpiresAt;
    }

    return response;
  }

  // Reports a transaction (e.g. CASH or NFC completion) against an existing PaymentRequest.
  // merchantId/employeeId are never accepted from the client; the caller's merchant must
  // own the target PaymentRequest.
  async recordTransaction(
    paymentRequestId: string,
    payload: CreateTransactionRequestDto,
    user?: { sub?: string; type?: string },
  ): Promise<PaymentRequestResponseDto> {
    if (!payload?.amount || payload.amount <= 0) {
      throw new BadRequestException('amount must be greater than 0.');
    }

    if (!payload?.paymentMethod?.trim()) {
      throw new BadRequestException('paymentMethod is required.');
    }

    await this.findOwnedPaymentRequest(paymentRequestId, user);

    return this.recordTransactionOn(paymentRequestId, payload);
  }

  // The collection operations below take an already-authorized PaymentRequest id. Two very
  // different callers reach them: a signed-in merchant or employee, and a courier holding a
  // hand-off token and no account at all (ADR-015). Authorization differs completely between
  // those two; what happens to the money afterwards must not.
  async recordTransactionOn(
    paymentRequestId: string,
    payload: CreateTransactionRequestDto,
  ): Promise<PaymentRequestResponseDto> {
    if (!payload?.amount || payload.amount <= 0) {
      throw new BadRequestException('amount must be greater than 0.');
    }

    if (!payload?.paymentMethod?.trim()) {
      throw new BadRequestException('paymentMethod is required.');
    }

    const result = await this.paymentEngine.recordTransaction({
      paymentRequestId,
      amount: payload.amount,
      paymentMethod: this.normalizePaymentMethod(payload.paymentMethod),
      providerReference: payload.providerReference?.trim() || undefined,
    });

    if (!result.success || !result.data) {
      throw new BadRequestException(result.error?.message ?? 'Unable to record transaction.');
    }

    return this.toResponse(result.data);
  }

  async getPaymentRequest(paymentRequestId: string): Promise<PaymentRequestResponseDto> {
    const paymentRequest = await this.paymentRequestRepository.findOne({
      where: { id: paymentRequestId },
      relations: ['transactions'],
    });

    if (!paymentRequest) {
      throw new NotFoundException(`PaymentRequest ${paymentRequestId} not found.`);
    }

    return this.toResponse(paymentRequest);
  }

  async generateQrOn(paymentRequestId: string): Promise<PaymentRequestResponseDto> {
    const result = await this.paymentEngine.generateQr({ paymentRequestId });

    if (!result.success || !result.data) {
      throw new BadRequestException(result.error?.message ?? 'Unable to generate a bank QR.');
    }

    const response = await this.getPaymentRequest(paymentRequestId);
    response.qrData = result.qrData;
    response.qrExpiresAt = result.qrExpiresAt;

    return response;
  }

  // Merchant callers see every PaymentRequest owned by their merchant. Employee callers
  // are further restricted to PaymentRequests they created themselves.
  async getPaymentRequestById(
    paymentRequestId: string,
    user?: { sub?: string; type?: string },
  ): Promise<PaymentRequestResponseDto> {
    const paymentRequest = await this.findOwnedPaymentRequest(paymentRequestId, user, { withTransactions: true });

    return this.toResponse(paymentRequest);
  }

  // Issues a real Bank QR (ADR-003) for a PaymentRequest that already exists, covering
  // whatever is still owed. This is what the courier taps at the door, and what makes a QR
  // usable after a partial cash payment. Ownership scoping matches getPaymentRequestById.
  async generateQr(
    paymentRequestId: string,
    user?: { sub?: string; type?: string },
  ): Promise<PaymentRequestResponseDto> {
    await this.findOwnedPaymentRequest(paymentRequestId, user);

    return this.generateQrOn(paymentRequestId);
  }

  // Opens a collection on behalf of an order platform (ADR-015). The merchant comes from the
  // platform's API key, and no employee owns it — the courier who collects it never signs in.
  // A repeated hand-off for the same order resolves to the PaymentRequest already created.
  async createForPartner(
    merchantId: string,
    externalOrderId: string,
    totalAmount: number,
    currency?: string,
  ): Promise<PaymentRequest> {
    const existing = await this.findByExternalOrderId(merchantId, externalOrderId);

    if (existing) {
      return existing;
    }

    try {
      const result = await this.paymentEngine.createPayment({
        merchantId,
        employeeId: null,
        totalAmount,
        currency: this.normalizeCurrency(currency),
        // Nobody knows how the customer will pay when the platform mints the hand-off. The
        // method is decided at the door and recorded per Transaction, and a bank QR is issued
        // on demand for whatever is still owed (ADR-002, ADR-013).
        paymentMethod: PaymentMethod.CASH,
        externalOrderId,
        expiresAt: this.normalizeExpiresAt(undefined),
      });

      if (!result.success || !result.data) {
        throw new BadRequestException(result.error?.message ?? 'Unable to create payment request.');
      }

      return result.data;
    } catch (error) {
      const raced = await this.findByExternalOrderId(merchantId, externalOrderId);

      if (raced) {
        return raced;
      }

      throw error;
    }
  }

  // Cancellation is a pure lifecycle transition: paidAmount is preserved exactly as
  // recorded and no refund is created. Ownership scoping matches getPaymentRequestById.
  async cancelPaymentRequest(
    paymentRequestId: string,
    user?: { sub?: string; type?: string },
  ): Promise<PaymentRequestResponseDto> {
    await this.findOwnedPaymentRequest(paymentRequestId, user);

    const result = await this.paymentEngine.cancelPayment({ paymentRequestId });

    if (!result.success || !result.data) {
      throw new BadRequestException(result.error?.message ?? 'Unable to cancel payment request.');
    }

    return this.toResponse(result.data);
  }

  // Merchant callers see every PaymentRequest owned by their merchant. Employee callers
  // are further restricted to PaymentRequests they created themselves.
  async listPaymentRequests(
    query: ListPaymentRequestsQueryDto,
    user?: { sub?: string; type?: string },
  ): Promise<PaymentRequestResponseDto[]> {
    const { merchant, employee } = await this.resolveIdentity(user);
    const status = this.normalizeStatusFilter(query?.status);

    const paymentRequests = await this.paymentRequestRepository.find({
      where: {
        merchantId: merchant.id,
        ...(employee ? { employeeId: employee.id } : {}),
        ...(status ? { status } : {}),
      },
      relations: ['transactions'],
    });

    return Promise.all(paymentRequests.map((paymentRequest) => this.toResponse(paymentRequest)));
  }

  // Single ownership gate for every operation that targets one existing PaymentRequest.
  // Merchant callers reach anything their merchant owns; employee callers are additionally
  // restricted to PaymentRequests they created themselves.
  private async findOwnedPaymentRequest(
    paymentRequestId: string,
    user?: { sub?: string; type?: string },
    options: { withTransactions?: boolean } = {},
  ): Promise<PaymentRequest> {
    const { merchant, employee } = await this.resolveIdentity(user);

    const paymentRequest = await this.paymentRequestRepository.findOne({
      where: { id: paymentRequestId },
      ...(options.withTransactions ? { relations: ['transactions'] } : {}),
    });

    if (!paymentRequest) {
      throw new NotFoundException(`PaymentRequest ${paymentRequestId} not found.`);
    }

    if (paymentRequest.merchantId !== merchant.id) {
      throw new UnauthorizedException('Payment request does not belong to the authenticated merchant.');
    }

    if (employee && paymentRequest.employeeId !== employee.id) {
      throw new UnauthorizedException('Payment request does not belong to the authenticated employee.');
    }

    return paymentRequest;
  }

  // Lookup by the order platform's own order id, scoped to the merchant that owns the
  // integration (ADR-015). This is how the partner channel reads a payment it never created.
  findByExternalOrderId(merchantId: string, externalOrderId: string): Promise<PaymentRequest | null> {
    return this.paymentRequestRepository.findOne({
      where: { merchantId, externalOrderId },
      relations: ['transactions'],
    });
  }

  async getByExternalOrderId(merchantId: string, externalOrderId?: string): Promise<PaymentRequestResponseDto> {
    const normalized = externalOrderId?.trim();

    if (!normalized) {
      throw new BadRequestException('externalOrderId is required.');
    }

    const paymentRequest = await this.findByExternalOrderId(merchantId, normalized);

    if (!paymentRequest) {
      throw new NotFoundException(`No payment request found for externalOrderId ${normalized}.`);
    }

    return this.toResponse(paymentRequest);
  }

  // remainingAmount is calculated via TransactionEngineService (through PaymentEngineService),
  // never stored on PaymentRequest, per ADR-002.
  private async toResponse(paymentRequest: PaymentRequest): Promise<PaymentRequestResponseDto> {
    const remainingAmountResult = await this.paymentEngine.getRemainingAmount(paymentRequest.id);

    if (!remainingAmountResult.success || remainingAmountResult.data === undefined) {
      throw new BadRequestException(
        remainingAmountResult.error?.message ?? 'Unable to calculate remaining amount.',
      );
    }

    return {
      id: paymentRequest.id,
      merchantId: paymentRequest.merchantId,
      employeeId: paymentRequest.employeeId ?? null,
      totalAmount: paymentRequest.totalAmount,
      paidAmount: paymentRequest.paidAmount,
      remainingAmount: remainingAmountResult.data,
      currency: paymentRequest.currency,
      paymentMethod: paymentRequest.paymentMethod,
      status: paymentRequest.status,
      externalOrderId: paymentRequest.externalOrderId ?? null,
      description: paymentRequest.description,
      expiresAt: paymentRequest.expiresAt,
      paidAt: paymentRequest.paidAt,
      createdAt: paymentRequest.createdAt,
      updatedAt: paymentRequest.updatedAt,
      transactions: (paymentRequest.transactions ?? []).map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        providerReference: transaction.providerReference,
        createdAt: transaction.createdAt,
      })),
    };
  }

  private normalizeStatusFilter(value?: string): PaymentLifecycleState | undefined {
    if (!value?.trim()) {
      return undefined;
    }

    const normalized = value.toUpperCase();
    if (!Object.values(PaymentLifecycleState).includes(normalized as PaymentLifecycleState)) {
      throw new BadRequestException(`Invalid status filter: ${value}.`);
    }

    return normalized as PaymentLifecycleState;
  }

  private async resolveIdentity(user?: { sub?: string; type?: string }): Promise<ResolvedIdentity> {
    if (!user?.sub) {
      throw new UnauthorizedException('Authentication required.');
    }

    if (user.type === 'merchant') {
      const merchant = await this.merchantRepository.findOne({ where: { id: user.sub } });
      if (!merchant) {
        throw new UnauthorizedException('Merchant not found.');
      }
      return { merchant, employee: null };
    }

    if (user.type === 'employee') {
      const employee = await this.employeeRepository.findOne({ where: { id: user.sub }, relations: ['merchant'] });
      if (!employee) {
        throw new UnauthorizedException('Employee not found.');
      }
      return { merchant: employee.merchant, employee };
    }

    throw new UnauthorizedException('Authentication required.');
  }

  private normalizeCurrency(value?: string): Currency {
    if (!value) {
      return Currency.TRY;
    }

    const normalized = value.toUpperCase();
    if (!Object.values(Currency).includes(normalized as Currency)) {
      throw new BadRequestException(`Invalid currency: ${value}.`);
    }

    return normalized as Currency;
  }

  private normalizePaymentMethod(value?: string): PaymentMethod {
    if (!value) {
      return PaymentMethod.QR;
    }

    const normalized = value.toUpperCase();
    if (!Object.values(PaymentMethod).includes(normalized as PaymentMethod)) {
      throw new BadRequestException(`Invalid paymentMethod: ${value}.`);
    }

    return normalized as PaymentMethod;
  }

  private normalizeExpiresAt(value?: Date | string): Date {
    if (value) {
      const parsed = value instanceof Date ? value : new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now;
  }
}
