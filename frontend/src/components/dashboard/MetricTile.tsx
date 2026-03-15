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
                'glassmorphism rounded-xl p-5 transition-all duration-300 hover:shadow-xl hover:bg-[var(--card)] group',
                className
            )}
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
