import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

export interface EncryptedPayload {
  iv: string;
  authTag: string;
  content: string;
}

@Injectable()
export class CredentialEncryptionService {
  private readonly key: Buffer;

  constructor() {
    const secret = process.env.CREDENTIAL_ENCRYPTION_SECRET || 'development-only-placeholder-secret';
    this.key = scryptSync(secret, 'kapida-credential-vault', KEY_LENGTH);
  }

  encrypt(plainText: string): EncryptedPayload {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const content = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);

    return {
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      content: content.toString('base64'),
    };
  }

  decrypt(payload: EncryptedPayload): string {
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(payload.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.content, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
