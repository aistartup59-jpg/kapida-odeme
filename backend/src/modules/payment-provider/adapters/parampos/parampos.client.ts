import { Injectable } from '@nestjs/common';

import { ParamPosConfig } from './parampos.config';

@Injectable()
export class ParamPosClient {
  constructor(private readonly config: ParamPosConfig) {}

  // HTTP communication with the ParamPOS API will be implemented here.
}
