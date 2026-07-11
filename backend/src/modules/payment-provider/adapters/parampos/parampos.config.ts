import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ParamPosConfig {
  constructor(private readonly configService: ConfigService) {}

  get baseUrl(): string {
    return this.configService.get<string>('parampos.baseUrl', '');
  }

  get mode(): string {
    return this.configService.get<string>('parampos.mode', 'TEST');
  }
}
