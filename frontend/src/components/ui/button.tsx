import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * The one button. Replaces the previous LiquidButton / MetalButton pair
 * (211 lines of bespoke gradients) with a small, theme-driven component.
 */
const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 ' +
    'focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50 ' +
    'active:scale-[0.98] select-none',
    {
        variants: {
            variant: {
                primary:
                    'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/25 ' +
                    'hover:shadow-xl hover:shadow-[var(--primary)]/30 hover:brightness-110',
                secondary:
                    'bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)] ' +
                    'hover:bg-[var(--accent)]',
                ghost:
                    'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]',
                destructive:
                    'bg-[var(--critical)]/10 text-[var(--critical)] border border-[var(--critical)]/25 ' +
                    'hover:bg-[var(--critical)]/20',
            },
            size: {
                sm: 'h-8 px-3 text-xs',
                md: 'h-10 px-4 text-sm',
                lg: 'h-12 px-6 text-sm',
            },
        },
        defaultVariants: { variant: 'primary', size: 'md' },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => (
        <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    )
)
Button.displayName = 'Button'
