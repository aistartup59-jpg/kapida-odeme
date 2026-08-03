import type { ReactNode } from "react";

/* Small shared pieces. Kept together so the page has one place that decides
   what a button, a badge or a section heading looks like. */

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "pink" | "ink" | "line" | "line-light";
  className?: string;
};

const BUTTON_BASE =
  "inline-flex items-center gap-2 rounded-lg px-[1.35rem] py-[0.72rem] text-[0.9rem] font-semibold whitespace-nowrap transition-colors";

const BUTTON_VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  pink: "bg-pink text-white hover:bg-pink-deep",
  ink: "bg-ink text-white hover:bg-[#26232b]",
  line: "border border-line-strong text-ink hover:border-ink",
  "line-light": "border border-white/30 text-white hover:border-white",
};

export function Button({ href, children, variant = "pink", className = "" }: ButtonProps) {
  return (
    <a href={href} className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`}>
      {children}
    </a>
  );
}

/**
 * The badge vocabulary. Every badge on the page states a product fact — none is
 * decoration, which is what keeps them from reading as stickers on a serious
 * product.
 */
type BadgeProps = {
  children: ReactNode;
  tone?: "pink" | "ink" | "line";
  className?: string;
};

const BADGE_TONES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  pink: "bg-pink-tint text-pink-deep",
  ink: "bg-ink text-white",
  line: "bg-white text-ink border border-line-strong",
};

export function Badge({ children, tone = "pink", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-[0.45rem] rounded-[7px] px-[0.7rem] py-[0.34rem] text-[0.74rem] font-semibold ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-pink">
      {children}
    </p>
  );
}

/** The three speed lines lifted off the logo mark, used only to open a section. */
export function SpeedRule() {
  return (
    <svg
      viewBox="0 0 120 14"
      aria-hidden
      className="block h-[14px] w-32 text-ink"
    >
      <g stroke="currentColor" strokeWidth={3.5} strokeLinecap="round">
        <path d="M2 3h84" />
        <path d="M2 7h118" />
        <path d="M2 11h62" />
      </g>
    </svg>
  );
}

type SectionProps = {
  id?: string;
  eyebrow?: string;
  rule?: boolean;
  title: string;
  description?: string;
  tone?: "paper" | "surface";
  children: ReactNode;
};

export function Section({
  id,
  eyebrow,
  rule,
  title,
  description,
  tone = "paper",
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`border-t border-line ${tone === "surface" ? "bg-surface" : ""}`}
    >
      <div className="mx-auto w-full max-w-6xl px-[clamp(1.15rem,5vw,3.5rem)] py-[clamp(3.5rem,8vw,6rem)]">
        <div className="max-w-[58ch]">
          {rule ? <SpeedRule /> : null}
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h2 className="mt-[0.9rem] mb-[1.1rem] text-balance font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.06] tracking-[-0.018em]">
            {title}
          </h2>
          {description ? (
            <p className="text-[clamp(1.02rem,2vw,1.14rem)] text-ink-2">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}
