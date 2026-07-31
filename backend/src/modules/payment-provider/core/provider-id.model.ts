// A payment provider is identified by a free-form string id, never a closed enum (ADR-014).
// Onboarding iyzico, PayTR, ParamPOS, or a bank's own gateway must require only a new
// adapter plus its registration — no enum edit, no schema migration, no business logic change.
export type ProviderId = string;

// Merchant-supplied provider ids arrive from the API, so they are normalized to a single
// canonical form before they are matched against the registry or persisted. Without this,
// 'param_pos' and 'PARAM_POS' would resolve to different registry keys.
export function normalizeProviderId(value: string): ProviderId {
  return value.trim().toUpperCase();
}
