import { useEffect, useState } from 'react'
import {
    getHealth, getModelInfo, getLatestReport, getHistory,
    computeDriftScore, getDriftStatus, fmtNum,
    type ModelInfo, type DriftReport, type HistoryPoint,
} from '@/lib/api'
import { Spotlight } from '@/components/ui/spotlight'
import { Typewriter } from '@/components/ui/typewriter'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { NeuralSphere } from '@/components/landing/NeuralSphere'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ChartContainer'
import { StatusBadge } from '@/components/StatusBadge'
import { DriftScoreGauge } from '@/components/DriftScoreGauge'
import { DriftGauge } from '@/components/dashboard/DriftGauge'
import { StatusIndicator } from '@/components/dashboard/StatusIndicator'
import { MetricTile } from '@/components/dashboard/MetricTile'
import { GlowingEffectDemo } from '@/components/ui/glowing-effect-demo'
import { GlowingCard } from '@/components/ui/glowing-card'
import { ContainerScroll } from '@/components/ui/container-scroll-animation'
import { Layers, Clock } from 'lucide-react'
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { motion } from 'framer-motion'

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function Dashboard() {
    const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null)
    const [model, setModel] = useState<ModelInfo | null>(null)
    const [latestReport, setLatestReport] = useState<DriftReport | null>(null)
    const [history, setHistory] = useState<HistoryPoint[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.allSettled([getHealth(), getModelInfo(), getLatestReport(), getHistory(30)])
            .then(([h, m, r, hist]) => {
                if (h.status === 'fulfilled') setHealth(h.value)
                if (m.status === 'fulfilled') setModel(m.value)
                if (r.status === 'fulfilled') setLatestReport(r.value)
                if (hist.status === 'fulfilled') setHistory(hist.value.points)
            })
            .finally(() => setLoading(false))
    }, [])

    const trendData = history.map((p, i) => ({
        idx: i + 1,
        label: p.timestamp ? new Date(p.timestamp).toLocaleDateString() : `#${i + 1}`,
        score: Number((p.drift_score * 100).toFixed(1)),
    }))

    const driftScore = latestReport ? computeDriftScore(latestReport) : 0
    const driftStatus = getDriftStatus(driftScore)

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

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <span className="loader" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-8">
            {/* ── Hero Section with Shader Background ── */}
            <div className="relative w-full min-h-[420px] overflow-hidden rounded-none">
                {/* Lightweight animated gradient background (was a WebGL shader) */}
                <div className="absolute inset-0 z-0">
                    <AuroraBackground />
                </div>
                {/* Overlay gradients */}
                <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />
                <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />

                <Spotlight className="-top-40 left-0 md:left-60 md:-top-20 z-[2]" fill="white" />

                <div className="relative z-[3] flex min-h-[420px]">
                    {/* Left: Title & status */}
                    <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                        <div className="mb-4">
                            {health && (
                                <StatusBadge status={health.status === 'healthy' ? 'healthy' : 'unhealthy'} />
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                            <Typewriter
                                text={[
                                    "Drift Monitor",
                                    "ML Health Dashboard",
                                    "Model Performance",
                                ]}
                                speed={80}
                                waitTime={2500}
                                deleteSpeed={40}
                                cursorChar="_"
                                className="bg-clip-text text-transparent bg-gradient-to-b from-[var(--foreground)] to-[var(--muted-foreground)]"
                            />
                        </h1>
                        <p className="mt-4 text-[var(--muted-foreground)] max-w-lg text-sm md:text-base">
                            Real-time monitoring of your ML model's health, data drift, and prediction quality.
                            {model && (
                                <span className="block mt-2 text-[var(--muted-foreground)]/80">
                                    Model v{model.model_version} • Accuracy: {(model.metrics.accuracy * 100).toFixed(1)}%
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Right: lightweight SVG neural sphere (was a 4.5MB Spline 3D scene) */}
                    <div className="flex-1 relative hidden lg:flex items-center justify-center">
                        <NeuralSphere />
                    </div>
                </div>
            </div>

            {/* ── Animated Scroll Section ── */}
            <ContainerScroll
                titleComponent={
                    <div className="flex flex-col items-center gap-4 mb-20">
                        <span className="text-sm font-semibold tracking-[0.4em] uppercase text-[var(--primary)]/80">
                            Deep Insights
                        </span>
                        <h2 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-[var(--foreground)] to-[var(--muted-foreground)]">
                            Model Health Telemetry
                        </h2>
                    </div>
                }
            >
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="flex flex-col gap-12 p-4"
                >
                    {/* Telemetry Metrics */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
                        <DriftGauge score={driftScore} />
                        <GlowingEffectDemo
                            healthStatus={health?.status === 'healthy' ? 'healthy' : 'offline'}
                            driftStatus={
                                driftScore > 0.4
                                    ? 'high-drift'
                                    : latestReport?.overall_drift
                                        ? 'drift'
                                        : 'stable'
                            }
                            driftScore={driftScore}
                            featuresCount={latestReport?.summary.total_features ?? model?.feature_names.length ?? 0}
                            lastCheck={
                                latestReport
                                    ? (() => {
                                        const mins = Math.round((Date.now() - new Date(latestReport.timestamp).getTime()) / 60000)
                                        if (mins < 1) return 'Just now'
                                        if (mins < 60) return `${mins}m ago`
                                        const hrs = Math.round(mins / 60)
                                        if (hrs < 24) return `${hrs}h ago`
                                        return `${Math.round(hrs / 24)}d ago`
                                    })()
                                    : 'N/A'
                            }
                            lastCheckString={latestReport ? new Date(latestReport.timestamp).toLocaleString() : ''}
                        />
                    </motion.div>

                    {/* Charts Row */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartContainer title="Baseline vs Production" subtitle="Numeric feature means">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={numericFeatures} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                                    <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            color: 'var(--foreground)',
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Baseline" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Production" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <GlowingCard className="p-0">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">Overall Drift Score</CardTitle>
                                <p className="text-xs text-[var(--muted-foreground)]">Severity-weighted across all features</p>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center py-6">
                                <DriftScoreGauge score={driftScore} />
                            </CardContent>
                        </GlowingCard>
                    </motion.div>

                    {/* Drift trend over time */}
                    <motion.div variants={itemVariants}>
                        <ChartContainer title="Drift Score Trend" subtitle="Drift score (%) across recent checks">
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
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                color: 'var(--foreground)',
                                            }}
                                        />
                                        <Line type="monotone" dataKey="score" name="Drift %" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </ChartContainer>
                    </motion.div>
                </motion.div>
            </ContainerScroll>

            {/* ── Top Drifting Features Table ── */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="px-6"
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Top Drifting Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {driftedFeatures.length === 0 ? (
                            <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
                                No drift detected — all features are within thresholds.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--border)]">
                                            <th className="text-left py-3 px-4 text-[var(--muted-foreground)] font-medium">Feature</th>
                                            <th className="text-left py-3 px-4 text-[var(--muted-foreground)] font-medium">Type</th>
                                            <th className="text-left py-3 px-4 text-[var(--muted-foreground)] font-medium">Baseline Mean</th>
                                            <th className="text-left py-3 px-4 text-[var(--muted-foreground)] font-medium">Production Mean</th>
                                            <th className="text-left py-3 px-4 text-[var(--muted-foreground)] font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {driftedFeatures.map((f) => (
                                            <tr key={f.name} className="border-b border-[var(--border)] hover:bg-[var(--secondary)]/50 transition-colors">
                                                <td className="py-3 px-4 font-medium">{f.name}</td>
                                                <td className="py-3 px-4">
                                                    <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-xs">
                                                        {f.feature_type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-[var(--muted-foreground)]">{fmtNum(f.baseline_mean)}</td>
                                                <td className="py-3 px-4 text-[var(--muted-foreground)]">{fmtNum(f.production_mean)}</td>
                                                <td className="py-3 px-4">
                                                    <StatusBadge status="drift" />
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
    )
}
