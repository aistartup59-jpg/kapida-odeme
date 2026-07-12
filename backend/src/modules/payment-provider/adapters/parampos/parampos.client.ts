import { Injectable } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';

import { ParamPosConfig } from './parampos.config';

@Injectable()
export class ParamPosClient {
  constructor(private readonly config: ParamPosConfig) {}

  // Generic sandbox transport only. The actual ParamPOS endpoint paths and
  // request/response payload shapes are supplied by the caller once the
  // official ParamPOS API contract is available — none is assumed here.
  post(path: string, body: Record<string, unknown>, headers: Record<string, string> = {}): Promise<Record<string, unknown>> {
    if (!this.config.baseUrl) {
      return Promise.reject(new Error('ParamPOS sandbox baseUrl is not configured.'));
    }

    const url = new URL(path, this.config.baseUrl);
    const payload = JSON.stringify(body);
    const client = url.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
      const req = client.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            ...headers,
          },
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => {
            raw += chunk;
          });
          res.on('end', () => {
            try {
              resolve(raw ? JSON.parse(raw) : {});
            } catch (error) {
              reject(error);
            }
          });
        },
      );

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }
}
