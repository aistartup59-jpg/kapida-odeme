import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VaultedCredential } from '../entities/vaulted-credential.entity';
import { CredentialEncryptionService } from './credential-encryption.service';

@Injectable()
export class CredentialVaultService {
  constructor(
    @InjectRepository(VaultedCredential)
    private readonly vaultRepository: Repository<VaultedCredential>,
    private readonly encryptionService: CredentialEncryptionService,
  ) {}

  async save(reference: string, plainCredential: string): Promise<void> {
    const encrypted = this.encryptionService.encrypt(plainCredential);

    // Upsert rather than insert: callers mint a fresh reference for every rotation, so a
    // collision should be impossible — but writing the same reference twice must not be the
    // thing that fails a credential update.
    await this.vaultRepository.upsert(
      {
        reference,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        content: encrypted.content,
      },
      ['reference'],
    );
  }

  async load(reference: string): Promise<string | null> {
    const stored = await this.vaultRepository.findOne({ where: { reference } });
    if (!stored) {
      return null;
    }

    return this.encryptionService.decrypt({
      iv: stored.iv,
      authTag: stored.authTag,
      content: stored.content,
    });
  }

  async delete(reference: string): Promise<void> {
    await this.vaultRepository.delete({ reference });
  }
}
