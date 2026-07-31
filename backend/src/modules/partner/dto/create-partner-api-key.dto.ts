import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePartnerApiKeyDto {
  // Names the integration the key is issued to ("Uber Eats", "Getir", ...) so one platform
  // can be revoked without cutting off the others.
  @IsString()
  @IsNotEmpty()
  label: string;
}
