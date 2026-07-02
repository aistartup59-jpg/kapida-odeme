import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtConfig } from './interfaces/jwt-config.interface';

@Injectable()
export class JwtConfigService {
  constructor(private readonly configService: ConfigService) {}

  get secret(): string {
    return this.configService.get<string>('jwt.secret', 'change_me');
  }

  get accessTokenExpiresIn(): string {
    return this.configService.get<string>('jwt.accessTokenExpiresIn', '15m');
  }

  get refreshTokenExpiresIn(): string {
    return this.configService.get<string>('jwt.refreshTokenExpiresIn', '7d');
  }

  get config(): JwtConfig {
    return {
      secret: this.secret,
      accessTokenExpiresIn: this.accessTokenExpiresIn,
      refreshTokenExpiresIn: this.refreshTokenExpiresIn,
    };
  }
}
