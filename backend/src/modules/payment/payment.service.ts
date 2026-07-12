import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Employee } from '../auth/entities/employee.entity';
import { Merchant } from '../auth/entities/merchant.entity';
import { PaymentRequest } from './entities/payment-request.entity';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { Currency } from './enums/currency.enum';
import { DeliveryChannel } from './enums/delivery-channel.enum';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentLifecycleState } from './enums/payment-lifecycle-state.enum';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async createPaymentRequest(payload: CreatePaymentRequestDto, user?: { sub?: string; type?: string }): Promise<PaymentRequest> {
    if (!payload?.totalAmount || payload.totalAmount <= 0) {
      throw new BadRequestException('totalAmount must be greater than 0.');
    }

    if (!payload?.paymentMethod?.trim()) {
      throw new BadRequestException('paymentMethod is required.');
    }

    if (!user?.sub) {
      throw new UnauthorizedException('Authentication required.');
    }

    let merchant: Merchant | null = null;
    let employee: Employee | null = null;

    if (user.type === 'merchant') {
      merchant = await this.merchantRepository.findOne({ where: { id: user.sub } });
      if (!merchant) {
        throw new UnauthorizedException('Merchant not found.');
      }
    } else if (user.type === 'employee') {
      employee = await this.employeeRepository.findOne({ where: { id: user.sub }, relations: ['merchant'] });
      if (!employee) {
        throw new UnauthorizedException('Employee not found.');
      }
      merchant = employee.merchant;
    } else {
      throw new UnauthorizedException('Authentication required.');
    }

    const paymentRequest = this.paymentRequestRepository.create({
      merchant,
      merchantId: merchant.id,
      employee: employee ?? null,
      employeeId: employee?.id ?? null,
      totalAmount: payload.totalAmount,
      paidAmount: 0,
      currency: this.normalizeCurrency(payload.currency),
      paymentMethod: this.normalizePaymentMethod(payload.paymentMethod),
      deliveryChannel: this.normalizeDeliveryChannel(payload.deliveryChannel),
      status: PaymentLifecycleState.PENDING,
      description: payload.description?.trim() || undefined,
      expiresAt: this.normalizeExpiresAt(payload.expiresAt),
    });

    return this.paymentRequestRepository.save(paymentRequest);
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
