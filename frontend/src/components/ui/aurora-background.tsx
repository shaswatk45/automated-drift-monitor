import { cn } from "@/lib/utils";

/**
 * Lightweight, GPU-cheap animated gradient background.
 *
 * The rotation is a pure CSS animation (see .animate-aurora in index.css):
 * the compositor rasterizes the blurred layer ONCE and rotates the texture,
 * unlike JS-driven animation which would re-run the 60px blur every frame.
 * Respects prefers-reduced-motion via the CSS media query.
 */
export function AuroraBackground({ className }: { className?: string }) {
    return (
        <div className={cn("absolute inset-0 overflow-hidden", className)}>
            <div
                className="animate-aurora absolute -inset-[30%] opacity-60"
                style={{
                    background:
                        "conic-gradient(from 90deg at 50% 50%, var(--chart-1) 0deg, transparent 90deg, var(--chart-2) 180deg, transparent 270deg, var(--chart-1) 360deg)",
                    filter: "blur(60px)",
                    willChange: "transform",
                }}
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
