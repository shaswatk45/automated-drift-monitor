"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
                destructive: "bg-[var(--destructive)] text-[var(--primary-foreground)] hover:opacity-90",
                outline: "border border-[var(--input)] bg-[var(--background)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
                secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-80",
                ghost: "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
                link: "text-[var(--primary)] underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-md px-8",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
        )
    }
)
Button.displayName = "Button"

/* ── Liquid Glass Button ── */
const liquidbuttonVariants = cva(
    "inline-flex items-center transition-colors justify-center cursor-pointer gap-2 whitespace-nowrap rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 outline-none",
    {
        variants: {
            variant: {
                default: "bg-transparent hover:scale-105 duration-300 transition text-[var(--primary)]",
                destructive: "bg-[var(--destructive)] text-white hover:opacity-90",
                outline: "border border-[var(--input)] bg-[var(--background)] hover:bg-[var(--accent)]",
                secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-80",
                ghost: "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
                link: "text-[var(--primary)] underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 text-xs gap-1.5 px-4",
                lg: "h-10 rounded-md px-6",
                xl: "h-12 rounded-md px-8",
                xxl: "h-14 rounded-md px-10",
                icon: "size-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "xxl",
        },
    }
)

function GlassFilter() {
    return (
        <svg className="hidden">
            <defs>
                <filter id="container-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
                    <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
                    <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
                    <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced" />
                    <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
                    <feComposite in="finalBlur" in2="finalBlur" operator="over" />
                </filter>
            </defs>
        </svg>
    )
}

function LiquidButton({
    className,
    variant,
    size,
    asChild = false,
    children,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof liquidbuttonVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : "button"
    return (
        <Comp
            data-slot="button"
            className={cn("relative", liquidbuttonVariants({ variant, size, className }))}
            {...props}
        >
            <div className="absolute top-0 left-0 z-0 h-full w-full rounded-full shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)] transition-all" />
            <div
                className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-md"
                style={{ backdropFilter: 'url("#container-glass")' }}
            />
            <div className="pointer-events-none z-10">{children}</div>
            <GlassFilter />
        </Comp>
    )
}

/* ── Metal Button ── */
const ShineEffect = ({ isPressed }: { isPressed: boolean }) => (
    <div className={cn("pointer-events-none absolute inset-0 z-20 overflow-hidden transition-opacity duration-300", isPressed ? "opacity-20" : "opacity-0")}>
        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-neutral-100 to-transparent" />
    </div>
)

type ColorVariant = "default" | "primary" | "success" | "error"

const colorVariants: Record<ColorVariant, { outer: string; inner: string; button: string; textColor: string; textShadow: string }> = {
    default: {
        outer: "bg-gradient-to-b from-[#000] to-[#A0A0A0]",
        inner: "bg-gradient-to-b from-[#FAFAFA] via-[#3E3E3E] to-[#E5E5E5]",
        button: "bg-gradient-to-b from-[#B9B9B9] to-[#969696]",
        textColor: "text-white",
        textShadow: "[text-shadow:_0_-1px_0_rgb(80_80_80_/_100%)]",
    },
    primary: {
        outer: "bg-gradient-to-b from-[#000] to-[#A0A0A0]",
        inner: "bg-gradient-to-b from-[var(--primary)] via-[var(--secondary)] to-[var(--muted)]",
        button: "bg-gradient-to-b from-[var(--primary)] to-[var(--primary)]/40",
        textColor: "text-white",
        textShadow: "[text-shadow:_0_-1px_0_rgb(30_58_138_/_100%)]",
    },
    success: {
        outer: "bg-gradient-to-b from-[#005A43] to-[#7CCB9B]",
        inner: "bg-gradient-to-b from-[#E5F8F0] via-[#00352F] to-[#D1F0E6]",
        button: "bg-gradient-to-b from-[#9ADBC8] to-[#3E8F7C]",
        textColor: "text-[#FFF7F0]",
        textShadow: "[text-shadow:_0_-1px_0_rgb(6_78_59_/_100%)]",
    },
    error: {
        outer: "bg-gradient-to-b from-[#5A0000] to-[#FFAEB0]",
        inner: "bg-gradient-to-b from-[#FFDEDE] via-[#680002] to-[#FFE9E9]",
        button: "bg-gradient-to-b from-[#F08D8F] to-[#A45253]",
        textColor: "text-[#FFF7F0]",
        textShadow: "[text-shadow:_0_-1px_0_rgb(146_64_14_/_100%)]",
    },
}

interface MetalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ColorVariant
}

const MetalButton = React.forwardRef<HTMLButtonElement, MetalButtonProps>(
    ({ children, className, variant = "default", ...props }, ref) => {
        const [isPressed, setIsPressed] = React.useState(false)
        const [isHovered, setIsHovered] = React.useState(false)
        const colors = colorVariants[variant]
        const transitionStyle = "all 250ms cubic-bezier(0.1, 0.4, 0.2, 1)"

        return (
            <div
                className={cn("relative inline-flex transform-gpu rounded-md p-[1.25px] will-change-transform", colors.outer)}
                style={{
                    transform: isPressed ? "translateY(2.5px) scale(0.99)" : "translateY(0) scale(1)",
                    boxShadow: isPressed ? "0 1px 2px rgba(0,0,0,0.15)" : isHovered ? "0 4px 12px rgba(0,0,0,0.12)" : "0 3px 8px rgba(0,0,0,0.08)",
                    transition: transitionStyle,
                }}
            >
                <div
                    className={cn("absolute inset-[1px] transform-gpu rounded-lg will-change-transform", colors.inner)}
                    style={{ transition: transitionStyle, filter: isHovered && !isPressed ? "brightness(1.05)" : "none" }}
                />
                <button
                    ref={ref}
                    className={cn(
                        "relative z-10 m-[1px] rounded-md inline-flex h-11 transform-gpu cursor-pointer items-center justify-center overflow-hidden px-6 py-2 text-sm leading-none font-semibold will-change-transform outline-none",
                        colors.button, colors.textColor, colors.textShadow, className
                    )}
                    style={{ transform: isPressed ? "scale(0.97)" : "scale(1)", transition: transitionStyle }}
                    {...props}
                    onMouseDown={() => setIsPressed(true)}
                    onMouseUp={() => setIsPressed(false)}
                    onMouseLeave={() => { setIsPressed(false); setIsHovered(false) }}
                    onMouseEnter={() => setIsHovered(true)}
                >
                    <ShineEffect isPressed={isPressed} />
                    {children || "Button"}
                    {isHovered && !isPressed && (
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t rounded-lg from-transparent to-white/5" />
                    )}
                </button>
            </div>
        )
    }
)
MetalButton.displayName = "MetalButton"

export { Button, buttonVariants, LiquidButton, liquidbuttonVariants, MetalButton }
