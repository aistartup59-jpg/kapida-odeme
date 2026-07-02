import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

@Injectable()
export class PasswordHashingService {
  hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
  }

  verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, storedKey] = hashedPassword.split(':');
    if (!salt || !storedKey) {
      return false;
    }

    const derivedKey = scryptSync(password, salt, 64);
    const storedKeyBuffer = Buffer.from(storedKey, 'hex');

    return timingSafeEqual(derivedKey, storedKeyBuffer);
  }
}
