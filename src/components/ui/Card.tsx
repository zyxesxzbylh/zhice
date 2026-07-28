"use client";

/**
 * Card — surface container. Three elevation levels + a `flat` variant
 * for nested cards inside a modal.
 *
 * Use `Card.Header` / `Card.Body` / `Card.Footer` for the common
 * header + body + action-bar layout. The plain `<Card>` is also valid
 * for one-off layouts.
 */

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";

export type CardVariant = "flat" | "elevated" | "outline";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
}

const variantClass: Record<CardVariant, string> = {
  flat: "bg-[var(--bg-surface)] border border-[var(--border-default)]",
  elevated: "bg-[var(--bg-surface)] shadow-md",
  outline: "bg-transparent border border-dashed border-[var(--border-strong)]",
};

const CardRoot = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "flat", interactive = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        variantClass[variant],
        interactive &&
          "cursor-pointer transition-shadow duration-200 hover:shadow-lg",
        className,
      )}
      style={{ borderRadius: radius.xl, boxShadow: "var(--shadow-sm)" }}
      {...rest}
    >
      {children}
    </div>
  );
});

function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-4 border-b border-[var(--border-default)]", className)}
      {...rest}
    />
  );
}

function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...rest} />;
}

function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 py-3 border-t border-[var(--border-default)] bg-[var(--bg-root)]",
        className,
      )}
      {...rest}
    />
  );
}

/**
 * Public Card component with `Header` / `Body` / `Footer` sub-components
 * attached as static properties.
 *
 *   <Card>
 *     <Card.Header>Title</Card.Header>
 *     <Card.Body>Content</Card.Body>
 *     <Card.Footer>Actions</Card.Footer>
 *   </Card>
 */
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
