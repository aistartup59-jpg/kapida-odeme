export const site = {
  name: "PayALS",
  tagline: "Ödemeyi kolaylaştırır",
  description:
    "PayALS kapıda ödemeyi kuryenin taşıdığı Android cihazda tamamlar: gerçek banka karekodu, temassız kart ve nakit — gerektiğinde aynı tahsilatta birlikte.",
} as const;

/** Measured out of the supplied logo artwork; the app uses the same values. */
export const brand = {
  pink: "#F00161",
  ink: "#000000",
} as const;

export const navigation = [
  { href: "#nasil", label: "Nasıl çalışır" },
  { href: "#parcali", label: "Parçalı tahsilat" },
  { href: "#guvenli", label: "Güvenlik" },
  { href: "#kimler", label: "Kimler için" },
  { href: "#sss", label: "SSS" },
] as const;

export type ContactChannel = {
  id: string;
  label: string;
  value: string;
  href: string;
  hint: string;
};

/**
 * Every way to reach us, in one place — the contact section renders whatever is
 * listed here. Adding WhatsApp later is one more entry, not a rewrite.
 *
 * The address depends on the pending domain decision (payals.com, see
 * AUDIT_BOARD.md); this is the only place it needs to change.
 */
export const contactChannels: ContactChannel[] = [
  {
    id: "email",
    label: "E-posta",
    value: "merhaba@payals.com",
    href: "mailto:merhaba@payals.com",
    hint: "Aynı iş günü içinde dönüş yapıyoruz.",
  },
];
