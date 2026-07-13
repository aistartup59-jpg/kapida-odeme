export class CreateMerchantPaymentProviderDto {
  providerType: string;
  credentials: Record<string, string>;
}
