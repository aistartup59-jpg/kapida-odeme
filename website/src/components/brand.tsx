import Image from "next/image";

/**
 * The logo, traced out of the supplied artwork into SVG. Served `unoptimized`
 * so Next passes the vector through untouched instead of rasterising it — a
 * logo that goes through the image optimiser stops being a vector.
 *
 * Intrinsic sizes come from the traced viewBoxes:
 *   lockup 1326 × 259   mark 786 × 506
 */

const LOCKUP_RATIO = 1326 / 259;
const MARK_RATIO = 786 / 506;

type Props = {
  /** Rendered height in pixels; width follows the artwork's own proportions. */
  height?: number;
  /** Ink swapped to white, for dark grounds. */
  inverse?: boolean;
  className?: string;
  priority?: boolean;
};

export function Lockup({ height = 34, inverse, className, priority }: Props) {
  return (
    <Image
      src={inverse ? "/brand/payals-lockup-inverse.svg" : "/brand/payals-lockup.svg"}
      alt="PayALS"
      width={Math.round(height * LOCKUP_RATIO)}
      height={height}
      className={className}
      priority={priority}
      unoptimized
    />
  );
}

export function Mark({ height = 28, inverse, className }: Props) {
  return (
    <Image
      src={inverse ? "/brand/payals-mark-inverse.svg" : "/brand/payals-mark.svg"}
      alt=""
      aria-hidden
      width={Math.round(height * MARK_RATIO)}
      height={height}
      className={className}
      unoptimized
    />
  );
}
