import { cn } from '@/lib/utils'

interface StatusBadgeProps {
    status: 'healthy' | 'unhealthy' | 'drift' | 'stable' | 'warning' | 'critical'
    className?: string
}

const statusConfig = {
    healthy: { label: 'Healthy', color: 'var(--success)' },
    stable: { label: 'Stable', color: 'var(--success)' },
    unhealthy: { label: 'Unhealthy', color: 'var(--critical)' },
    drift: { label: 'Drift', color: 'var(--critical)' },
    warning: { label: 'Warning', color: 'var(--warning)' },
    critical: { label: 'Critical', color: 'var(--critical)' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status]
    return (
        <span 
            className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-colors', className)}
            style={{ 
                backgroundColor: `color-mix(in srgb, ${config.color} 10%, transparent)`,
                color: config.color,
                borderColor: `color-mix(in srgb, ${config.color} 20%, transparent)`
            }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.color }} />
            {config.label}
        </span>
    )
}
