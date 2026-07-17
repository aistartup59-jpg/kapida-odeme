import { IsOptional, IsString } from 'class-validator';

export class ListPaymentRequestsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}
