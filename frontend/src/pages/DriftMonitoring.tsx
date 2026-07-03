import { useEffect, useState, useCallback } from 'react'
import {
    getLatestReport, runDriftCheck, computeDriftScore, fmtNum,
    featureSignal, featureSeverity,
    type DriftReport,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChartContainer } from '@/components/ChartContainer'
import { StatusBadge } from '@/components/StatusBadge'
import { DriftGauge } from '@/components/dashboard/DriftGauge'
import { AlertPanel } from '@/components/AlertPanel'
import { PageShell, PageHeader } from '@/components/PageShell'
import { Upload, FileUp, Activity } from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

const chartTooltipStyle = {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--foreground)',
} as const

function SummaryChip({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border"
            style={{
                backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
                color,
            }}
        >
            <span className="text-sm font-bold tabular-nums">{count}</span> {label}
        </span>
    )
}

export default function DriftMonitoring() {
    const [report, setReport] = useState<DriftReport | null>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        getLatestReport()
            .then(setReport)
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const handleFile = useCallback(async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            setError('Only CSV files are supported.')
            return
        }
        setError(null)
        setUploading(true)
        try {
            const result = await runDriftCheck(file)
            setReport(result)
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Drift check failed.')
        } finally {
            setUploading(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }, [handleFile])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }, [handleFile])

    const driftScore = report ? computeDriftScore(report) : 0
    const summary = report?.summary

    const numericData = report
        ? Object.entries(report.feature_results)
            .filter(([, v]) => v.feature_type === 'numeric')
            .map(([name, v]) => ({
                name: name.replace(/_/g, ' '),
                Baseline: Number((v.baseline_mean ?? 0).toFixed(1)),
                Production: Number((v.production_mean ?? 0).toFixed(1)),
            }))
        : []

    const categoricalData = report
        ? Object.entries(report.feature_results)
            .filter(([, v]) => v.feature_type === 'categorical' && v.baseline_distribution && v.production_distribution)
            .map(([name, v]) => {
                const categories = new Set([
                    ...Object.keys(v.baseline_distribution || {}),
                    ...Object.keys(v.production_distribution || {}),
                ])
                return { name, categories: Array.from(categories), feature: v }
            })
        : []

    const alerts = report
        ? Object.entries(report.feature_results)
            .filter(([, v]) => v.drift_detected && v.reasons.length > 0)
            .map(([name, v]) => ({ feature: name, reasons: v.reasons, severity: featureSeverity(v) }))
        : []

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <span className="loader" />
            </div>
        )
    }

    return (
        <PageShell>
            <PageHeader
                icon={Activity}
                title="Drift Monitoring"
                subtitle="Upload production data and analyze feature drift against the training baseline"
                actions={
                    summary && (
                        <div className="flex flex-wrap items-center gap-2">
                            <SummaryChip label="critical" count={summary.critical_count ?? 0} color="var(--critical)" />
                            <SummaryChip label="warning" count={summary.warning_count ?? 0} color="var(--warning)" />
                            <SummaryChip label="stable" count={summary.stable_count} color="var(--success)" />
                        </div>
                    )
                }
            />

            {/* Upload + score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Run Drift Check</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            className={`rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 ${dragOver
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5 scale-[1.01]'
                                : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
                                }`}
                        >
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                                <Upload className="h-6 w-6 text-[var(--primary)]" />
                            </div>
                            <p className="mb-1 text-sm font-medium">
                                Drag &amp; drop a production CSV here
                            </p>
                            <p className="mb-5 text-xs text-[var(--muted-foreground)]">
                                Rows are compared feature-by-feature against training statistics (PSI, KS-Test, frequency shift)
                            </p>
                            <input id="drift-file-upload" type="file" accept=".csv" onChange={handleInputChange} className="hidden" />
                            <Button
                                disabled={uploading}
                                onClick={() => document.getElementById('drift-file-upload')?.click()}
                            >
                                <FileUp className="h-4 w-4" />
                                {uploading ? 'Running...' : 'Upload & Run'}
                            </Button>
                        </div>
                        {error && <p className="mt-3 text-sm text-[var(--critical)]">{error}</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Overall Drift Score</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-6">
                        <DriftGauge score={driftScore} />
                    </CardContent>
                </Card>
            </div>

            {/* Feature drift table */}
            {report && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Feature Drift Table</CardTitle>
                            <span className="text-xs text-[var(--muted-foreground)]">
                                {report.summary.drifted_count} of {report.summary.total_features} features drifted
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)]">
                                        <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Feature</th>
                                        <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Type</th>
                                        <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Baseline Mean</th>
                                        <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Prod Mean</th>
                                        <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Signal</th>
                                        <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(report.feature_results).map(([name, f]) => (
                                        <tr key={name} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--secondary)]/50">
                                            <td className="py-3 px-4 font-medium">{name}</td>
                                            <td className="py-3 px-4">
                                                <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-xs">{f.feature_type}</span>
                                            </td>
                                            <td className="py-3 px-4 text-[var(--muted-foreground)]">{fmtNum(f.baseline_mean)}</td>
                                            <td className="py-3 px-4 text-[var(--muted-foreground)]">{fmtNum(f.production_mean)}</td>
                                            <td className="py-3 px-4 font-mono text-xs text-[var(--muted-foreground)]">{featureSignal(f)}</td>
                                            <td className="py-3 px-4">
                                                <StatusBadge status={featureSeverity(f)} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Charts */}
            {report && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartContainer title="Numeric Features: Baseline vs Production" subtitle="Comparing feature means">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={numericData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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

                    {categoricalData.map((data) => (
                        <ChartContainer
                            key={data.name}
                            title={`Categorical: ${data.name}`}
                            subtitle="Distribution comparison"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data.categories.map((cat) => ({
                                        name: cat.replace('_', ' '),
                                        Baseline: Number(((data.feature.baseline_distribution?.[cat] || 0) * 100).toFixed(1)),
                                        Production: Number(((data.feature.production_distribution?.[cat] || 0) * 100).toFixed(1)),
                                    }))}
                                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                                    <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} unit="%" />
                                    <Tooltip contentStyle={chartTooltipStyle} />
                                    <Legend />
                                    <Bar dataKey="Baseline" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Production" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    ))}
                </div>
            )}

            {/* Alerts */}
            {report && (
                <div>
                    <h2 className="mb-3 text-lg font-semibold">Drift Alerts</h2>
                    <AlertPanel alerts={alerts} />
                </div>
            )}
        </PageShell>
    )
}
