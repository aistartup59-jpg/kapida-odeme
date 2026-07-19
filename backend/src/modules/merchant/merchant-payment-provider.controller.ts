import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMerchantPaymentProviderDto } from './dto/create-merchant-payment-provider.dto';
import { UpdateMerchantPaymentProviderDto } from './dto/update-merchant-payment-provider.dto';
import { MerchantPaymentProviderService } from './merchant-payment-provider.service';

@Controller('merchant/payment-providers')
@UseGuards(JwtAuthGuard)
export class MerchantPaymentProviderController {
  constructor(private readonly merchantPaymentProviderService: MerchantPaymentProviderService) {}

  @Post()
  create(
    @CurrentUser() user: { sub?: string; type?: string },
    @Body() dto: CreateMerchantPaymentProviderDto,
  ) {
    return this.merchantPaymentProviderService.register(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { sub?: string; type?: string }) {
    return this.merchantPaymentProviderService.findAll(user);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { sub?: string; type?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMerchantPaymentProviderDto,
  ) {
    return this.merchantPaymentProviderService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { sub?: string; type?: string }, @Param('id', ParseUUIDPipe) id: string) {
    return this.merchantPaymentProviderService.remove(user, id);
  }

  @Post(':id/activate')
  activate(@CurrentUser() user: { sub?: string; type?: string }, @Param('id', ParseUUIDPipe) id: string) {
    return this.merchantPaymentProviderService.activate(user, id);
  }
}
