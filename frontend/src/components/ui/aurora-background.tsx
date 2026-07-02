"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Lightweight, GPU-cheap animated gradient background.
 *
 * Replaces the previous three.js WebGL shader hero: it uses only CSS gradients
 * animated via a single transform, so it costs a fraction of a WebGL context
 * and respects prefers-reduced-motion (framer-motion disables the loop).
 */
export function AuroraBackground({ className }: { className?: string }) {
    return (
        <div className={cn("absolute inset-0 overflow-hidden", className)}>
            <motion.div
                className="absolute -inset-[40%] opacity-60"
                style={{
                    background:
                        "conic-gradient(from 90deg at 50% 50%, var(--chart-1) 0deg, transparent 90deg, var(--chart-2) 180deg, transparent 270deg, var(--chart-1) 360deg)",
                    filter: "blur(80px)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(circle at 50% 40%, transparent 0%, var(--background) 75%)",
                }}
            />
        </div>
    );
}

export default AuroraBackground;
