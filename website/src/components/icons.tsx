import type { SVGProps } from "react";

/**
 * Icons drawn from the product's own objects — a code, a contactless card,
 * notes, a shield, a phone — rather than a generic set. Single stroke weight so
 * they read as one family next to the logo's even line.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconQr(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3h-3zM20 14v1M20 20h1M14 20h3v1" />
    </Base>
  );
}

export function IconNfc(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2" y="5" width="12" height="14" rx="2.5" />
      <path d="M17 8.5a5 5 0 0 1 0 7M20.5 6a9 9 0 0 1 0 12" />
    </Base>
  );
}

export function IconCash(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M5.5 9.5h.01M18.5 14.5h.01" />
    </Base>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3l7.5 3v5.5c0 4.4-3.1 8.4-7.5 9.5-4.4-1.1-7.5-5.1-7.5-9.5V6z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </Base>
  );
}

export function IconPhone(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="6" y="2.5" width="12" height="19" rx="3" />
      <path d="M10.5 18.5h3" />
    </Base>
  );
}

export function IconSplit(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12h5M8 12l5-6h8M8 12l5 6h8" />
      <path d="M18 3l3 3-3 3M18 15l3 3-3 3" />
    </Base>
  );
}

export function IconPlug(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 3v6M15 3v6" />
      <path d="M5.5 9h13v3a6.5 6.5 0 0 1-13 0z" />
      <path d="M12 18.5V22" />
    </Base>
  );
}

export function IconLock(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="10" width="16" height="11" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Base>
  );
}

export function IconLedger(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Base>
  );
}

export function IconArrow(props: IconProps) {
  return (
    <Base strokeWidth={1.8} {...props}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </Base>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Base strokeWidth={2} {...props}>
      <path d="M4 12.5l5 5L20 6.5" />
    </Base>
  );
}
