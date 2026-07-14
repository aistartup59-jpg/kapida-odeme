import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Employee } from '../auth/entities/employee.entity';
import { Merchant } from '../auth/entities/merchant.entity';
import { PaymentEngineService } from './engine/payment-engine.service';
import { PaymentRequest } from './entities/payment-request.entity';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { CreateTransactionRequestDto } from './dto/create-transaction-request.dto';
import { Currency } from './enums/currency.enum';
import { DeliveryChannel } from './enums/delivery-channel.enum';
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

  async createPaymentRequest(payload: CreatePaymentRequestDto, user?: { sub?: string; type?: string }): Promise<PaymentRequest> {
    if (!payload?.totalAmount || payload.totalAmount <= 0) {
      throw new BadRequestException('totalAmount must be greater than 0.');
    }

    if (!payload?.paymentMethod?.trim()) {
      throw new BadRequestException('paymentMethod is required.');
    }

    const { merchant, employee } = await this.resolveIdentity(user);

    const result = await this.paymentEngine.createPayment({
      merchantId: merchant.id,
      employeeId: employee?.id ?? null,
      totalAmount: payload.totalAmount,
      currency: this.normalizeCurrency(payload.currency),
      paymentMethod: this.normalizePaymentMethod(payload.paymentMethod),
      deliveryChannel: this.normalizeDeliveryChannel(payload.deliveryChannel),
      description: payload.description?.trim() || undefined,
      expiresAt: this.normalizeExpiresAt(payload.expiresAt),
    });

    if (!result.success || !result.data) {
      throw new BadRequestException(result.error?.message ?? 'Unable to create payment request.');
    }

    return result.data;
  }

  // Reports a transaction (e.g. CASH or NFC completion) against an existing PaymentRequest.
  // merchantId/employeeId are never accepted from the client; the caller's merchant must
  // own the target PaymentRequest.
  async recordTransaction(
    paymentRequestId: string,
    payload: CreateTransactionRequestDto,
    user?: { sub?: string; type?: string },
  ): Promise<PaymentRequest> {
    if (!payload?.amount || payload.amount <= 0) {
      throw new BadRequestException('amount must be greater than 0.');
    }

    if (!payload?.paymentMethod?.trim()) {
      throw new BadRequestException('paymentMethod is required.');
    }

    const { merchant } = await this.resolveIdentity(user);

    const paymentRequest = await this.paymentRequestRepository.findOne({ where: { id: paymentRequestId } });

    if (!paymentRequest) {
      throw new NotFoundException(`PaymentRequest ${paymentRequestId} not found.`);
    }

    if (paymentRequest.merchantId !== merchant.id) {
      throw new UnauthorizedException('Payment request does not belong to the authenticated merchant.');
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

    return result.data;
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
    return Object.values(Currency).includes(normalized as Currency) ? (normalized as Currency) : Currency.TRY;
  }

  private normalizePaymentMethod(value?: string): PaymentMethod {
    if (!value) {
      return PaymentMethod.QR;
    }

    const normalized = value.toUpperCase();
    return Object.values(PaymentMethod).includes(normalized as PaymentMethod)
      ? (normalized as PaymentMethod)
      : PaymentMethod.QR;
  }

  private normalizeDeliveryChannel(value?: string): DeliveryChannel {
    if (!value) {
      return DeliveryChannel.NONE;
    }

    const normalized = value.toUpperCase();
    return Object.values(DeliveryChannel).includes(normalized as DeliveryChannel)
      ? (normalized as DeliveryChannel)
      : DeliveryChannel.NONE;
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
