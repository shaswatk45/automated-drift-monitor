import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricTileProps {
    title: string
    value: string | number
    subtitle?: string
    icon: LucideIcon
    accentColor?: string
    className?: string
}

export function MetricTile({ title, value, subtitle, icon: Icon, accentColor = 'var(--primary)', className }: MetricTileProps) {
    return (
        <div
            className={cn(
                'rounded-xl border border-[var(--border)]/50 bg-[var(--card)]/40 backdrop-blur-md p-5 transition-all duration-300 hover:shadow-2xl hover:bg-[var(--card)]/60 group',
                className
            )}
            style={{ boxShadow: `0 10px 30px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)` }}
        >
            <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    {title}
                </p>
                <div
                    className="rounded-lg p-2 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)` }}
                >
                    <Icon className="h-4 w-4" style={{ color: accentColor }} />
                </div>
            </div>

            <div>
                <p className="text-2xl font-bold tabular-nums" style={{ color: accentColor }}>
                    {value}
                </p>
                {subtitle && (
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>
                )}
            </div>
        </div>
    )
}
