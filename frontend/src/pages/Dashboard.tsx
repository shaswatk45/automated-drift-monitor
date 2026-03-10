import { useEffect, useState } from 'react'
import {
    getHealth, getModelInfo, getLatestReport,
    computeDriftScore, getDriftStatus,
    type ModelInfo, type DriftReport,
} from '@/lib/api'
import { SplineScene } from '@/components/ui/splite'
import { Spotlight } from '@/components/ui/spotlight'
import { Typewriter } from '@/components/ui/typewriter'
import { ShaderAnimation } from '@/components/ui/shader-animation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/StatCard'
import { ChartContainer } from '@/components/ChartContainer'
import { StatusBadge } from '@/components/StatusBadge'
import { DriftScoreGauge } from '@/components/DriftScoreGauge'
import {
    HeartPulse, Activity, Layers, Clock, AlertTriangle,
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

export default function Dashboard() {
    const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null)
    const [model, setModel] = useState<ModelInfo | null>(null)
    const [latestReport, setLatestReport] = useState<DriftReport | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.allSettled([getHealth(), getModelInfo(), getLatestReport()])
            .then(([h, m, r]) => {
                if (h.status === 'fulfilled') setHealth(h.value)
                if (m.status === 'fulfilled') setModel(m.value)
                if (r.status === 'fulfilled') setLatestReport(r.value)
            })
            .finally(() => setLoading(false))
    }, [])

    const driftScore = latestReport ? computeDriftScore(latestReport) : 0
    const driftStatus = getDriftStatus(driftScore)

    const numericFeatures = latestReport
        ? Object.entries(latestReport.feature_results)
            .filter(([, v]) => v.feature_type === 'numeric')
            .map(([name, v]) => ({
                name: name.replace(/_/g, ' '),
                Baseline: Number(v.baseline_mean.toFixed(1)),
                Production: Number(v.production_mean.toFixed(1)),
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
                {/* Shader Animation Background */}
                <div className="absolute inset-0 z-0">
                    <ShaderAnimation />
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
                                className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400"
                            />
                        </h1>
                        <p className="mt-4 text-neutral-400 max-w-lg text-sm md:text-base">
                            Real-time monitoring of your ML model's health, data drift, and prediction quality.
                            {model && (
                                <span className="block mt-2 text-neutral-500">
                                    Model v{model.model_version} • Accuracy: {(model.metrics.accuracy * 100).toFixed(1)}%
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Right: Spline 3D scene */}
                    <div className="flex-1 relative hidden lg:block">
                        <SplineScene
                            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                            className="w-full h-full"
                        />
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Drift Score"
                    value={driftScore.toFixed(2)}
                    subtitle={driftStatus.label}
                    icon={Activity}
                    accentColor={driftStatus.color}
                />
                <StatCard
                    title="Model Status"
                    value={health?.status === 'healthy' ? 'Healthy' : 'Down'}
                    subtitle={model ? `v${model.model_version}` : ''}
                    icon={HeartPulse}
                    accentColor={health?.status === 'healthy' ? 'var(--success)' : 'var(--critical)'}
                />
                <StatCard
                    title="Drift Status"
                    value={latestReport?.overall_drift ? 'Drift Detected' : 'Stable'}
                    subtitle={latestReport ? `${latestReport.summary.drifted_count} features drifted` : ''}
                    icon={AlertTriangle}
                    accentColor={latestReport?.overall_drift ? 'var(--warning)' : 'var(--success)'}
                />
                <StatCard
                    title="Features"
                    value={latestReport?.summary.total_features ?? model?.feature_names.length ?? 0}
                    subtitle="Monitored"
                    icon={Layers}
                    accentColor="var(--chart-4)"
                />
                <StatCard
                    title="Last Check"
                    value={latestReport ? new Date(latestReport.timestamp).toLocaleDateString() : 'N/A'}
                    subtitle={latestReport ? new Date(latestReport.timestamp).toLocaleTimeString() : ''}
                    icon={Clock}
                    accentColor="var(--chart-1)"
                />
            </div>

            {/* ── Charts Row ── */}
            <div className="px-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Overall Drift Score</CardTitle>
                        <p className="text-xs text-[var(--muted-foreground)]">Ratio of drifted to total features</p>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center py-6">
                        <DriftScoreGauge score={driftScore} />
                    </CardContent>
                </Card>
            </div>

            {/* ── Top Drifting Features Table ── */}
            <div className="px-6">
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
                                                <td className="py-3 px-4 text-[var(--muted-foreground)]">{f.baseline_mean.toFixed(4)}</td>
                                                <td className="py-3 px-4 text-[var(--muted-foreground)]">{f.production_mean.toFixed(4)}</td>
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
            </div>
        </div>
    )
}
