import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  @IsNotEmpty()
  invitationToken: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
