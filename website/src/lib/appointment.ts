/**
 * Shape and validation for a demo appointment request, shared by the form and the
 * route handler. The client uses it to show errors next to fields; the server runs
 * it again because nothing arriving over the network is trusted.
 */

export const AUDIENCES = ["business", "platform"] as const;

export type Audience = (typeof AUDIENCES)[number];

export const AUDIENCE_LABELS: Record<Audience, string> = {
  business: "Küçük işletme",
  platform: "Sipariş platformu",
};

export type AppointmentInput = {
  name: string;
  company: string;
  email: string;
  phone: string;
  audience: Audience;
  preferredAt: string;
  message: string;
};

export type AppointmentErrors = Partial<Record<keyof AppointmentInput, string>>;

export const EMPTY_APPOINTMENT: AppointmentInput = {
  name: "",
  company: "",
  email: "",
  phone: "",
  audience: "business",
  preferredAt: "",
  message: "",
};

// Deliberately permissive: the point is to catch typos, not to adjudicate what a
// valid address looks like. Delivery is the real test.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Turkish numbers, written however people actually write them — spaces, dashes,
// parentheses and an optional +90 all survive normalisation.
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

export function normalisePhone(value: string): string {
  return value.replace(/[\s()\-.]/g, "");
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export type AppointmentResult =
  | { ok: true; data: AppointmentInput }
  | { ok: false; errors: AppointmentErrors };

export function validateAppointment(raw: unknown): AppointmentResult {
  const source = (raw ?? {}) as Record<string, unknown>;
  const errors: AppointmentErrors = {};

  const name = asString(source.name);
  if (name.length < 2) {
    errors.name = "Adınızı yazın.";
  } else if (name.length > 120) {
    errors.name = "Ad en fazla 120 karakter olabilir.";
  }

  const company = asString(source.company);
  if (company.length > 160) {
    errors.company = "İşletme adı en fazla 160 karakter olabilir.";
  }

  const email = asString(source.email);
  if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Geçerli bir e-posta adresi yazın.";
  } else if (email.length > 200) {
    errors.email = "E-posta adresi çok uzun.";
  }

  const phone = normalisePhone(asString(source.phone));
  if (phone.length > 0 && !PHONE_PATTERN.test(phone)) {
    errors.phone = "Telefon numarasını kontrol edin.";
  }

  const audienceValue = asString(source.audience);
  const audience = AUDIENCES.find((candidate) => candidate === audienceValue);
  if (!audience) {
    errors.audience = "Hangi taraf olduğunuzu seçin.";
  }

  const preferredAt = asString(source.preferredAt);
  if (preferredAt.length > 120) {
    errors.preferredAt = "Tarih bilgisi çok uzun.";
  }

  const message = asString(source.message);
  if (message.length > 2000) {
    errors.message = "Mesaj en fazla 2000 karakter olabilir.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      company,
      email,
      phone,
      audience: audience as Audience,
      preferredAt,
      message,
    },
  };
}
