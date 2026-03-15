"use client";

import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

interface GlowingCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  disabled?: boolean;
  spread?: number;
  proximity?: number;
  inactiveZone?: number;
  borderWidth?: number;
}

export function GlowingCard({
  children,
  className,
  glow = true,
  disabled = false,
  spread = 40,
  proximity = 64,
  inactiveZone = 0.01,
  borderWidth = 3,
}: GlowingCardProps) {
  return (
    <div className={cn("relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3", className)}>
      <GlowingEffect
        spread={spread}
        glow={glow}
        disabled={disabled}
        proximity={proximity}
        inactiveZone={inactiveZone}
        borderWidth={borderWidth}
      />
      <div className="relative h-full overflow-hidden rounded-xl border-[0.75px] bg-[var(--card)]/40 p-6 shadow-sm glassmorphism dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
        {children}
      </div>
    </div>
  );
}
