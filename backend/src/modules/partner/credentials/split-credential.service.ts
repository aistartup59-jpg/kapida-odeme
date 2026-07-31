import { randomBytes } from 'crypto';

import { Injectable } from '@nestjs/common';

import { PasswordHashingService } from '../../auth/password-hashing.service';

export interface IssuedCredential {
  publicId: string;
  secret: string;
  token: string;
}

export interface ParsedCredential {
  publicId: string;
  secret: string;
}

// Both credentials this module issues — the long-lived partner API key and the short-lived
// hand-off token — have the same shape: `<prefix>_<publicId>_<secret>`.
//
// The split exists because a fully hashed credential cannot be looked up. publicId is stored
// in the clear and indexed so the row is found in one query; only the secret is hashed, and it
// is what actually authenticates. This mirrors how the auth module already treats refresh and
// invitation tokens, which are found through their owning row rather than through the token.
@Injectable()
export class SplitCredentialService {
  constructor(private readonly passwordHashing: PasswordHashingService) {}

  issue(prefix: string): IssuedCredential {
    const publicId = randomBytes(8).toString('hex');
    const secret = randomBytes(32).toString('hex');

    return { publicId, secret, token: `${prefix}_${publicId}_${secret}` };
  }

  parse(token: string | undefined, prefix: string): ParsedCredential | null {
    const parts = token?.trim().split('_') ?? [];

    if (parts.length !== 3 || parts[0] !== prefix || !parts[1] || !parts[2]) {
      return null;
    }

    return { publicId: parts[1], secret: parts[2] };
  }

  hash(secret: string): string {
    return this.passwordHashing.hashPassword(secret);
  }

  verify(secret: string, hash: string): boolean {
    return this.passwordHashing.verifyPassword(secret, hash);
  }
}
