import { useEffect, useState } from 'react'
import {
    getHealth, getModelInfo, getLatestReport, getHistory,
    computeDriftScore, fmtNum, featureSeverity, featureSignal,
    type ModelInfo, type DriftReport, type HistoryPoint,
} from '@/lib/api'
import { Typewriter } from '@/components/ui/typewriter'
import { NeuralSphere } from '@/components/landing/NeuralSphere'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ChartContainer'
import { StatusBadge } from '@/components/StatusBadge'
import { DriftGauge } from '@/components/dashboard/DriftGauge'
import { MetricTile } from '@/components/dashboard/MetricTile'
import { GlowingCard } from '@/components/ui/glowing-card'
import { PageShell } from '@/components/PageShell'
import { Activity, Layers, Clock, Server } from 'lucide-react'
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { motion } from 'framer-motion'

const chartTooltipStyle = {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--foreground)',
} as const

function relativeTime(iso: string): string {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.round(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.round(hrs / 24)}d ago`
}

const sectionVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
}

export default function Dashboard() {
    const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null)
    const [model, setModel] = useState<ModelInfo | null>(null)
    const [latestReport, setLatestReport] = useState<DriftReport | null>(null)
    const [history, setHistory] = useState<HistoryPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [backendOffline, setBackendOffline] = useState(false)

    useEffect(() => {
        Promise.allSettled([getHealth(), getModelInfo(), getLatestReport(), getHistory(30)])
            .then(([h, m, r, hist]) => {
                if (h.status === 'fulfilled') setHealth(h.value)
                if (m.status === 'fulfilled') setModel(m.value)
                if (r.status === 'fulfilled') setLatestReport(r.value)
                if (hist.status === 'fulfilled') setHistory(hist.value.points)
                setBackendOffline(h.status === 'rejected')
            })
            .finally(() => setLoading(false))
    }, [])

    const driftScore = latestReport ? computeDriftScore(latestReport) : 0

    const numericFeatures = latestReport
        ? Object.entries(latestReport.feature_results)
            .filter(([, v]) => v.feature_type === 'numeric')
            .map(([name, v]) => ({
                name: name.replace(/_/g, ' '),
                Baseline: Number((v.baseline_mean ?? 0).toFixed(1)),
                Production: Number((v.production_mean ?? 0).toFixed(1)),
            }))
        : []

    const driftedFeatures = latestReport
        ? Object.entries(latestReport.feature_results)
            .filter(([, v]) => v.drift_detected)
            .map(([name, v]) => ({ name, ...v }))
        : []

    const trendData = history.map((p, i) => ({
        idx: i + 1,
        label: p.timestamp ? new Date(p.timestamp).toLocaleDateString() : `#${i + 1}`,
        score: Number((p.drift_score * 100).toFixed(1)),
    }))

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <span className="loader" />
            </div>
        )
    }

    return (
        <PageShell bleed className="space-y-8 pb-4">
            {backendOffline && (
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 rounded-lg border border-[var(--critical)]/30 bg-[var(--critical)]/10 px-4 py-3 text-sm">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--critical)]" />
                        <span>
                            Cannot reach the backend API. Start the server
                            (<code className="text-xs">uvicorn backend.main:app</code>) - showing empty data until it responds.
                        </span>
                    </div>
                </div>
            )}

            {/* Hero (static glow - the animated aurora already lives in the Layout backdrop) */}
            <section className="relative w-full min-h-[360px] overflow-hidden">
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        background:
                            'radial-gradient(ellipse 70% 60% at 30% 40%, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 70%)',
                    }}
                />
                <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />

                <div className="relative z-[2] mx-auto flex min-h-[360px] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
                    <div className="flex-1 py-10">
                        <div className="mb-4 flex items-center gap-3">
                            {health && (
                                <StatusBadge status={health.status === 'healthy' ? 'healthy' : 'unhealthy'} />
                            )}
                            {model && (
                                <span className="rounded-full border border-[var(--border)] bg-[var(--secondary)]/60 px-3 py-1 text-xs text-[var(--muted-foreground)]">
                                    Model v{model.model_version} &middot; Acc {(model.metrics.accuracy * 100).toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                            <Typewriter
                                text={['Drift Monitor', 'ML Health Console', 'Model Telemetry']}
                                speed={80}
                                waitTime={2500}
                                deleteSpeed={40}
                                cursorChar="_"
                                className="bg-clip-text text-transparent bg-gradient-to-b from-[var(--foreground)] to-[var(--muted-foreground)]"
                            />
                        </h1>
                        <p className="mt-4 max-w-lg text-sm md:text-base text-[var(--muted-foreground)]">
                            Real-time monitoring of your ML model's health, data drift, and prediction quality.
                        </p>
                    </div>

                    <div className="hidden lg:flex flex-1 items-center justify-center">
                        <NeuralSphere />
                    </div>
                </div>
            </section>

            {/* Console body */}
            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                {/* Stat row */}
                <motion.div
                    variants={sectionVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <MetricTile
                        title="Backend"
                        value={health?.status === 'healthy' ? 'Online' : 'Offline'}
                        subtitle={health ? new Date(health.timestamp).toLocaleTimeString() : 'unreachable'}
                        icon={Server}
                        accentColor={health?.status === 'healthy' ? 'var(--success)' : 'var(--critical)'}
                    />
                    <MetricTile
                        title="Drift Score"
                        value={`${(driftScore * 100).toFixed(1)}%`}
                        subtitle="severity-weighted"
                        icon={Activity}
                        accentColor={driftScore <= 0.2 ? 'var(--success)' : driftScore <= 0.4 ? 'var(--warning)' : 'var(--critical)'}
                    />
                    <MetricTile
                        title="Features"
                        value={latestReport?.summary.total_features ?? model?.feature_names.length ?? 0}
                        subtitle={`${latestReport?.summary.drifted_count ?? 0} drifted`}
                        icon={Layers}
                        accentColor="var(--primary)"
                    />
                    <MetricTile
                        title="Last Check"
                        value={latestReport ? relativeTime(latestReport.timestamp) : 'Never'}
                        subtitle={latestReport ? new Date(latestReport.timestamp).toLocaleString() : 'upload a CSV to start'}
                        icon={Clock}
                        accentColor="var(--chart-4)"
                    />
                </motion.div>

                {/* Gauge + trend */}
                <motion.div
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-40px' }}
                    className="grid grid-cols-1 lg:grid-cols-5 gap-6"
                >
                    <GlowingCard className="p-0 lg:col-span-2">
                        <DriftGauge score={driftScore} />
                    </GlowingCard>
                    <div className="lg:col-span-3">
                        <ChartContainer
                            title="Drift Score Trend"
                            subtitle="Severity-weighted drift score (%) across recent checks"
                            className="h-full"
                        >
                            {trendData.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                                    Run a few drift checks to see the trend over time.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                                        <YAxis unit="%" domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                                        <Tooltip contentStyle={chartTooltipStyle} />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            name="Drift %"
                                            stroke="var(--chart-2)"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </ChartContainer>
                    </div>
                </motion.div>

                {/* Baseline vs production + drifted features */}
                <motion.div
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-40px' }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                    <ChartContainer title="Baseline vs Production" subtitle="Numeric feature means">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={numericFeatures} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                                <Tooltip contentStyle={chartTooltipStyle} />
                                <Legend />
                                <Bar dataKey="Baseline" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Production" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Top Drifting Features</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {driftedFeatures.length === 0 ? (
                                <p className="py-10 text-center text-sm text-[var(--muted-foreground)]">
                                    No drift detected - all features are within thresholds.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-[var(--border)]">
                                                <th className="py-2.5 px-3 text-left font-medium text-[var(--muted-foreground)]">Feature</th>
                                                <th className="py-2.5 px-3 text-left font-medium text-[var(--muted-foreground)]">Signal</th>
                                                <th className="py-2.5 px-3 text-left font-medium text-[var(--muted-foreground)]">Baseline</th>
                                                <th className="py-2.5 px-3 text-left font-medium text-[var(--muted-foreground)]">Production</th>
                                                <th className="py-2.5 px-3 text-left font-medium text-[var(--muted-foreground)]">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {driftedFeatures.map((f) => (
                                                <tr key={f.name} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--secondary)]/50">
                                                    <td className="py-2.5 px-3 font-medium">{f.name}</td>
                                                    <td className="py-2.5 px-3 font-mono text-xs text-[var(--muted-foreground)]">{featureSignal(f)}</td>
                                                    <td className="py-2.5 px-3 text-[var(--muted-foreground)]">{fmtNum(f.baseline_mean)}</td>
                                                    <td className="py-2.5 px-3 text-[var(--muted-foreground)]">{fmtNum(f.production_mean)}</td>
                                                    <td className="py-2.5 px-3">
                                                        <StatusBadge status={featureSeverity(f)} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </PageShell>
    )
}
