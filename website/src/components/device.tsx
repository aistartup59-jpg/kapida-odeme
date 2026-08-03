import Image from "next/image";

/**
 * A real screenshot in a phone bezel.
 *
 * These replaced hand-drawn mock screens: the drawings had started to show a
 * product that does not exist — a contactless tap screen and a PIN pad neither
 * of which are built. Captures cannot drift from the app that way.
 *
 * Source images are the device's own 720×1600 output, cropped to the app area
 * (status bar and navigation bar removed) and resampled to 560 wide.
 */

const SHOT_W = 560;
const SHOT_H = 1129;

type Props = {
  /** File in /public/screens, without extension. */
  src: "login" | "home" | "qr" | "partial" | "done";
  alt: string;
  size?: "sm" | "lg";
  glow?: boolean;
  priority?: boolean;
  className?: string;
};

export function DeviceShot({ src, alt, size = "lg", glow, priority, className = "" }: Props) {
  const large = size === "lg";

  return (
    <div
      className={[
        "relative z-[2] overflow-hidden border-[#141318] bg-[#faf8f9]",
        large ? "w-[min(17.5rem,80vw)] border-[10px] rounded-[32px]" : "w-[min(13.5rem,72vw)] border-8 rounded-[26px]",
        glow
          ? "shadow-[0_44px_90px_-42px_rgba(240,1,97,0.6),0_12px_30px_-18px_rgba(0,0,0,0.25)]"
          : "shadow-[0_22px_48px_-28px_rgba(0,0,0,0.3)]",
        className,
      ].join(" ")}
    >
      <Image
        src={`/screens/${src}.png`}
        alt={alt}
        width={SHOT_W}
        height={SHOT_H}
        priority={priority}
        sizes={large ? "280px" : "216px"}
        className="block h-auto w-full"
      />
    </div>
  );
}
