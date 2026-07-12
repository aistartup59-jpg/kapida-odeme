import { Injectable } from '@nestjs/common';

const VISIBLE_CHARS = 4;
const MASK_CHAR = '*';

@Injectable()
export class CredentialMaskingService {
  mask(value: string): string {
    if (!value) {
      return '';
    }

    if (value.length <= VISIBLE_CHARS) {
      return MASK_CHAR.repeat(value.length);
    }

    const visible = value.slice(-VISIBLE_CHARS);
    return `${MASK_CHAR.repeat(value.length - VISIBLE_CHARS)}${visible}`;
  }
}
