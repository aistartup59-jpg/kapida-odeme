let counter = 0;

export interface MerchantRegisterPayload {
  businessName: string;
  ownerFullName: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export function buildMerchantPayload(overrides: Partial<MerchantRegisterPayload> = {}): MerchantRegisterPayload {
  counter += 1;
  return {
    businessName: `Test Business ${counter}`,
    ownerFullName: `Test Owner ${counter}`,
    phoneNumber: `+90555000${String(counter).padStart(4, '0')}`,
    email: `merchant${counter}@test.local`,
    password: 'StrongPass123',
    ...overrides,
  };
}
