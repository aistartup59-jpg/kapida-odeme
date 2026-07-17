import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class MerchantLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
