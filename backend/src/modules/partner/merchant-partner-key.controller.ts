import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePartnerApiKeyDto } from './dto/create-partner-api-key.dto';
import { PartnerApiKeyService } from './partner-api-key.service';

// Merchant-facing management of the keys handed to order platforms. Employees are excluded:
// issuing an integration credential is a business owner action, matching how payment provider
// configuration is already scoped.
@Controller('merchant/partner-keys')
@UseGuards(JwtAuthGuard)
export class MerchantPartnerKeyController {
  constructor(private readonly partnerApiKeyService: PartnerApiKeyService) {}

  @Post()
  async create(@CurrentUser() user: { sub?: string; type?: string }, @Body() dto: CreatePartnerApiKeyDto) {
    return this.partnerApiKeyService.issue(this.resolveMerchantId(user), dto?.label);
  }

  @Get()
  async findAll(@CurrentUser() user: { sub?: string; type?: string }) {
    const keys = await this.partnerApiKeyService.findAllByMerchant(this.resolveMerchantId(user));
    return keys.map((key) => this.partnerApiKeyService.toSummary(key));
  }

  @Delete(':id')
  async remove(@CurrentUser() user: { sub?: string; type?: string }, @Param('id', ParseUUIDPipe) id: string) {
    await this.partnerApiKeyService.revoke(this.resolveMerchantId(user), id);
  }

  private resolveMerchantId(user?: { sub?: string; type?: string }): string {
    if (!user?.sub || user.type !== 'merchant') {
      throw new UnauthorizedException('Authentication required.');
    }

    return user.sub;
  }
}
