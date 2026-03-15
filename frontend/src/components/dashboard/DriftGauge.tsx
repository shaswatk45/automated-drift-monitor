import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'
import { GlowingCard } from '@/components/ui/glowing-card'

interface DriftGaugeProps {
    score: number
    label?: string
}

function getGaugeColor(score: number) {
    if (score <= 0.2) return { color: '#22c55e', glow: 'rgba(34,197,94,0.25)', label: 'Stable' }
    if (score <= 0.4) return { color: '#eab308', glow: 'rgba(234,179,8,0.25)', label: 'Moderate Drift' }
    return { color: '#ef4444', glow: 'rgba(239,68,68,0.3)', label: 'High Drift' }
}

export function DriftGauge({ score, label }: DriftGaugeProps) {
    const { color, label: severityLabel } = getGaugeColor(score)
    const percentage = Math.round(score * 100)
    const data = [{ value: percentage, fill: color }]

    return (
        <GlowingCard className="p-0">
            <div className="flex flex-col items-center justify-center w-full h-full">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] mb-2">
                    {label || 'Drift Severity'}
                </p>

                <div className="relative w-52 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%" cy="50%"
                            innerRadius="72%" outerRadius="100%"
                            startAngle={225} endAngle={-45}
                            barSize={14}
                            data={data}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar
                                dataKey="value"
                                cornerRadius={8}
                                background={{ fill: 'var(--secondary)', opacity: 0.5 }}
                                isAnimationActive={true}
                                animationDuration={1200}
                                animationEasing="ease-out"
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>

                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold tabular-nums" style={{ color }}>{score.toFixed(2)}</span>
                        <span className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mt-1">score</span>
                    </div>
                </div>

                {/* Severity badge */}
                <div
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
                >
                    <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                    {severityLabel}
                </div>
            </div>
        </GlowingCard>
    )
}

