import { cn } from '@/lib/utils'
import { getDriftStatus } from '@/lib/api'

interface DriftScoreGaugeProps {
    score: number
    className?: string
}

export function DriftScoreGauge({ score, className }: DriftScoreGaugeProps) {
    const { label, color } = getDriftStatus(score)
    const percentage = Math.round(score * 100)
    const circumference = 2 * Math.PI * 54
    const offset = circumference - (score * circumference)

    return (
        <div className={cn('flex flex-col items-center gap-3', className)}>
            <div className="relative h-36 w-36">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                    {/* Background circle */}
                    <circle cx="60" cy="60" r="54" fill="none" stroke="var(--secondary)" strokeWidth="8" />
                    {/* Progress circle */}
                    <circle
                        cx="60" cy="60" r="54"
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold" style={{ color }}>{score.toFixed(2)}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">Score</span>
                </div>
            </div>
            <div className="text-center">
                <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
                >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                </span>
            </div>
        </div>
    )
}
