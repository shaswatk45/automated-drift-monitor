import { cn } from '@/lib/utils'

interface StatusBadgeProps {
    status: 'healthy' | 'unhealthy' | 'drift' | 'stable' | 'warning' | 'critical'
    className?: string
}

const statusConfig = {
    healthy: { label: 'Healthy', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    stable: { label: 'Stable', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    unhealthy: { label: 'Unhealthy', bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
    drift: { label: 'Drift', bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
    warning: { label: 'Warning', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
    critical: { label: 'Critical', bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status]
    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', config.bg, config.text, className)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
            {config.label}
        </span>
    )
}
