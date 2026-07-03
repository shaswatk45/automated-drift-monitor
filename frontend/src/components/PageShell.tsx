import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

/**
 * Shared page scaffolding so every console page has identical rhythm:
 * same max width, gutters, header typography, and fade-in.
 */

interface PageHeaderProps {
    icon: LucideIcon
    title: string
    subtitle?: string
    actions?: React.ReactNode
}

export function PageHeader({ icon: Icon, title, subtitle, actions }: PageHeaderProps) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                        <Icon className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
                </div>
                {subtitle && (
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">{subtitle}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
    )
}

interface PageShellProps {
    children: React.ReactNode
    className?: string
    /** Full-bleed pages (e.g. the dashboard hero) can opt out of the container. */
    bleed?: boolean
}

export function PageShell({ children, className, bleed = false }: PageShellProps) {
    return (
        <div
            className={cn(
                'animate-page-in',
                bleed ? 'w-full' : 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6',
                className
            )}
        >
            {children}
        </div>
    )
}
