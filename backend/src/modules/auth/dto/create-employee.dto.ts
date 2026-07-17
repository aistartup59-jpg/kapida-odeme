import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateEmployeeDto {
  @IsUUID()
  @IsNotEmpty()
  merchantId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
