"use client";

import { useState } from "react";

/**
 * A fixed scramble, not 1–9. Shuffling on mount would mean the server and the
 * client disagree on the first render, and a real device never shows an ordered
 * pad anyway — so the ordered state is one this component should never have.
 */
const INITIAL = [7, 2, 9, 4, 0, 6, 1, 8, 3, 5];

function shuffled() {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

/**
 * The feature being described is that the digits move, so the demonstration has
 * to actually move them. Driven by a button rather than a timer: numbers
 * changing on their own at the edge of vision is noise, not information.
 */
export function SecureKeypad() {
  const [digits, setDigits] = useState<number[]>(INITIAL);

  return (
    <div className="grid justify-items-center gap-4">
      <div className="w-[min(15rem,74vw)] rounded-2xl border border-line bg-white p-[1.1rem] shadow-[0_26px_55px_-34px_rgba(0,0,0,0.3)]">
        <div className="text-center">
          <span className="block text-[0.64rem] uppercase tracking-[0.14em] text-faint">
            Ödenecek tutar
          </span>
          <span className="block font-display text-[1.5rem] font-bold tracking-[-0.02em] tabular-nums">
            ₺120,00
          </span>
        </div>

        <div aria-hidden className="my-[0.9rem] flex justify-center gap-2">
          {[0, 1, 2, 3].map((slot) => (
            <i
              key={slot}
              className={`size-[0.6rem] rounded-full ${slot < 2 ? "bg-ink" : "bg-line-strong"}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {digits.slice(0, 9).map((digit) => (
            <Key key={digit} digit={digit} />
          ))}
          <Key digit={digits[9]} className="col-start-2" />
        </div>
      </div>

      <p className="max-w-[30ch] text-center text-[0.8rem] text-faint">
        Tasarlanan ekran. Tuş takımı her açılışta yeniden karışacak.
      </p>

      <button
        type="button"
        onClick={() => setDigits(shuffled())}
        className="inline-flex items-center rounded-lg border border-line-strong px-[1.35rem] py-[0.72rem] text-[0.9rem] font-semibold transition-colors hover:border-ink"
      >
        Yeniden karıştır
      </button>
    </div>
  );
}

function Key({ digit, className = "" }: { digit: number; className?: string }) {
  return (
    <button
      type="button"
      aria-label={`${digit} tuşu`}
      className={`aspect-[1.35] rounded-[10px] border border-line bg-white text-[1.05rem] font-semibold tabular-nums transition-colors hover:bg-surface ${className}`}
    >
      {digit}
    </button>
  );
}
