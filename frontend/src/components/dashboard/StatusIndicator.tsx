import { cn } from '@/lib/utils'

type StatusType = 'online' | 'offline' | 'stable' | 'drift' | 'high-drift'

interface StatusIndicatorProps {
    type: StatusType
    title: string
    className?: string
}

const statusConfig: Record<StatusType, { label: string; color: string; icon: string; glow: string }> = {
    online: { label: 'Online', color: '#22c55e', icon: '●', glow: 'rgba(34,197,94,0.2)' },
    offline: { label: 'Down', color: '#ef4444', icon: '●', glow: 'rgba(239,68,68,0.2)' },
    stable: { label: 'Stable', color: '#22c55e', icon: '●', glow: 'rgba(34,197,94,0.2)' },
    drift: { label: 'Drift Detected', color: '#f59e0b', icon: '▲', glow: 'rgba(245,158,11,0.2)' },
    'high-drift': { label: 'High Drift', color: '#ef4444', icon: '⚠', glow: 'rgba(239,68,68,0.2)' },
}

export function StatusIndicator({ type, title, className }: StatusIndicatorProps) {
    const config = statusConfig[type]

    return (
        <div
            className={cn(
                'rounded-xl border border-[var(--border)]/50 bg-[var(--card)]/40 backdrop-blur-md p-5 transition-all duration-300 hover:shadow-2xl hover:bg-[var(--card)]/60',
                className
            )}
            style={{ boxShadow: `0 0 24px ${config.glow}, inset 0 1px 0 rgba(255,255,255,0.1)` }}
        >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] mb-3">
                {title}
            </p>

            <div className="flex items-center gap-2.5">
                {/* Pulsing dot */}
                <span className="relative flex h-3 w-3">
                    <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                        style={{ backgroundColor: config.color }}
                    />
                    <span
                        className="relative inline-flex rounded-full h-3 w-3"
                        style={{ backgroundColor: config.color }}
                    />
                </span>

                <span className="text-lg font-bold uppercase tracking-wide" style={{ color: config.color }}>
                    {config.label}
                </span>
            </div>
        </div>
    )
}
