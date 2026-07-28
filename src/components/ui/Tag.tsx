"use client";

/**
 * Tag — small label for project tags, filter chips, and meta.
 *
 * 由 foundation-contract 任务提供: this lives next to `Badge` but is
 * dedicated to the project's user-defined tags (see `Tag` type in
 * `@/lib/types`). It accepts either an explicit `(bg, text)` color
 * pair or a `Tag`-shaped object.
 *
 * Two variants:
 *  - `default` — small pill with rounded corners
 *  - `solid`   — fills the full chip with the tag's color
 *
 * For tag colors the canonical source is `tagPalette` in `@/lib/theme`
 * (dark backgrounds + white text) for the dark chip style, or
 * `tagColors` (graduated grayscale) for the lighter inline style.
 */

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { radius, tagPalette } from "@/lib/theme";
import type { Tag as ThemeTag } from "@/lib/types";

export type TagVariant = "default" | "solid" | "outline";

export interface TagProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  /** Hex color used as the background. Defaults to a palette swatch. */
  color?: string;
  /** Text color. Defaults to white for dark bgs, dark for light bgs. */
  textColor?: string;
  /** Use a swatch from `tagPalette` by index. Ignored when `color` is set. */
  paletteIndex?: number;
  variant?: TagVariant;
  children?: ReactNode;
}

function isLight(hex: string): boolean {
  // Strip leading `#`; handle 3-digit shorthand.
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // YIQ luminance — returns 0..255.
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160;
}

export function Tag({
  color,
  textColor,
  paletteIndex,
  variant = "default",
  className,
  style,
  children,
  ...rest
}: TagProps) {
  const swatch = color
    ? { bg: color, text: textColor ?? (isLight(color) ? "#1f2937" : "#ffffff") }
    : tagPalette[((paletteIndex ?? 0) % tagPalette.length) % tagPalette.length];

  const variantClass =
    variant === "solid"
      ? "border-transparent"
      : variant === "outline"
        ? "bg-transparent"
        : "border-transparent";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border",
        variantClass,
        className,
      )}
      style={{
        backgroundColor: variant === "outline" ? "transparent" : swatch.bg,
        color: swatch.text,
        borderColor: swatch.bg,
        borderRadius: radius.full,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

/**
 * Convenience wrapper for rendering a `Tag` from the canonical
 * `{ bg, text }` shape used in `tagPalette` / `tagColors`.
 */
export interface TagSwatchProps extends Omit<TagProps, "color" | "textColor" | "paletteIndex"> {
  swatch: { bg: string; text: string };
}

export function TagSwatch({ swatch, children, ...rest }: TagSwatchProps) {
  return (
    <Tag color={swatch.bg} textColor={swatch.text} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Render an array of `Tag` rows (the Prisma model, not this component).
 * Skips entries without a name.
 */
export interface TagListProps {
  tags: ReadonlyArray<Partial<ThemeTag> & { id: string; name: string }>;
  empty?: ReactNode;
  className?: string;
}

export function TagList({ tags, empty, className }: TagListProps) {
  if (!tags || tags.length === 0) return <>{empty ?? null}</>;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {tags.map((t) => (
        <Tag key={t.id} color={t.color ?? undefined}>
          {t.name}
        </Tag>
      ))}
    </span>
  );
}
