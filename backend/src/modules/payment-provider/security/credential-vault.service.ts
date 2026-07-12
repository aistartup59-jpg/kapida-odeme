import { Injectable } from '@nestjs/common';

import { CredentialEncryptionService, EncryptedPayload } from './credential-encryption.service';

@Injectable()
export class CredentialVaultService {
  // Placeholder in-memory store. Persistent storage is out of scope for this sprint.
  private readonly store = new Map<string, EncryptedPayload>();

  constructor(private readonly encryptionService: CredentialEncryptionService) {}

  async save(reference: string, plainCredential: string): Promise<void> {
    this.store.set(reference, this.encryptionService.encrypt(plainCredential));
  }

  async load(reference: string): Promise<string | null> {
    const encrypted = this.store.get(reference);
    if (!encrypted) {
      return null;
    }

    return this.encryptionService.decrypt(encrypted);
  }

  async delete(reference: string): Promise<void> {
    this.store.delete(reference);
  }
}
