import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SplitCredentialService } from './credentials/split-credential.service';
import { HandoffSession } from './entities/handoff-session.entity';

export interface IssuedHandoff {
  handoffToken: string;
  expiresAt: Date;
}

export const HANDOFF_TOKEN_PREFIX = 'hof';

// Long enough to survive a delivery that goes badly — traffic, a customer who is not at the
// door, a card that has to be tried twice — and short enough that a token left behind on a
// courier's device is worthless by the end of the shift.
const HANDOFF_LIFETIME_MS = 4 * 60 * 60 * 1000;

@Injectable()
export class HandoffSessionService {
  constructor(
    @InjectRepository(HandoffSession)
    private readonly handoffSessionRepository: Repository<HandoffSession>,
    private readonly credentials: SplitCredentialService,
  ) {}

  async issue(paymentRequestId: string): Promise<IssuedHandoff> {
    const credential = this.credentials.issue(HANDOFF_TOKEN_PREFIX);
    const expiresAt = new Date(Date.now() + HANDOFF_LIFETIME_MS);

    await this.handoffSessionRepository.save(
      this.handoffSessionRepository.create({
        paymentRequestId,
        publicId: credential.publicId,
        secretHash: this.credentials.hash(credential.secret),
        expiresAt,
      }),
    );

    return { handoffToken: credential.token, expiresAt };
  }

  // Returns the single PaymentRequest this token may act on, or null when the token is
  // malformed, unknown, expired, or its secret does not match. Because the token carries its
  // own scope, no id is taken from the request — there is nothing for a caller to substitute.
  async resolvePaymentRequestId(presentedToken?: string): Promise<string | null> {
    const parsed = this.credentials.parse(presentedToken, HANDOFF_TOKEN_PREFIX);

    if (!parsed) {
      return null;
    }

    const session = await this.handoffSessionRepository.findOne({ where: { publicId: parsed.publicId } });

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return this.credentials.verify(parsed.secret, session.secretHash) ? session.paymentRequestId : null;
  }
}
