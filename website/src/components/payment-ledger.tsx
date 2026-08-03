"use client";

import { useEffect, useRef, useState } from "react";
import { IconSplit } from "@/components/icons";
import { Badge } from "@/components/ui";

// The split the app can actually record today: bank QR plus cash. Contactless
// joins this list when the provider's SoftPOS component lands, not before.
const ROWS = [
  { label: "Karekod · banka uygulaması", amount: "₺300,00", share: 62.5, dot: "bg-pink" },
  { label: "Nakit · kuryeye elden", amount: "₺180,00", share: 37.5, dot: "bg-ink" },
];

/**
 * Money accumulating is the point of this section, so the bar earns its
 * animation by filling as it comes into view. Under reduced motion it is simply
 * already full — the information is in the proportions, not the movement.
 */
export function PaymentLedger() {
  const ref = useRef<HTMLDivElement>(null);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Reduced motion is handled in CSS rather than here, so the bar reads
    // correctly even before this effect — or any JavaScript — has run.
    if (!("IntersectionObserver" in window)) {
      const id = setTimeout(() => setFilled(true), 0);
      return () => clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setFilled(true);
          observer.disconnect();
        });
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-line bg-paper p-[clamp(1.25rem,3vw,1.85rem)] shadow-[0_28px_60px_-40px_rgba(0,0,0,0.28)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[0.72rem] uppercase tracking-[0.14em] text-faint">
            Tahsilat tutarı
          </span>
          <div className="font-display text-[2.15rem] font-bold tracking-[-0.025em] tabular-nums">
            ₺480,00
          </div>
        </div>
        <Badge>
          <IconSplit className="size-[0.95rem]" /> Parçalı
        </Badge>
      </div>

      <div aria-hidden className="my-5 flex h-[10px] overflow-hidden rounded-full bg-line">
        {ROWS.map((row) => (
          <i
            key={row.label}
            className={`block h-full transition-[width] duration-[900ms] ease-[cubic-bezier(.22,.7,.3,1)] motion-reduce:!w-[var(--share)] motion-reduce:transition-none ${row.dot}`}
            style={
              {
                "--share": `${row.share}%`,
                width: filled ? "var(--share)" : "0%",
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <ul className="grid gap-[0.7rem]">
        {ROWS.map((row) => (
          <li
            key={row.label}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-[0.92rem]"
          >
            <i className={`size-[0.6rem] rounded-full ${row.dot}`} />
            <span className="text-muted">{row.label}</span>
            <b className="font-semibold tabular-nums">{row.amount}</b>
          </li>
        ))}
      </ul>

      <div className="mt-[1.35rem] flex items-baseline justify-between border-t border-line pt-[1.1rem] font-semibold">
        <span>Kalan tutar</span>
        <b className="text-[1.1rem] tabular-nums text-pink">₺0,00</b>
      </div>
    </div>
  );
}
