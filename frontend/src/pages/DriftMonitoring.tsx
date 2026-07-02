import { useEffect, useState, useCallback } from 'react'
import { SmokeBackground } from '@/components/ui/spooky-smoke-animation'
import {
    getLatestReport, runDriftCheck, computeDriftScore, fmtNum,
    type DriftReport,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetalButton } from '@/components/ui/liquid-glass-button'
import { ChartContainer } from '@/components/ChartContainer'
import { StatusBadge } from '@/components/StatusBadge'
import { DriftScoreGauge } from '@/components/DriftScoreGauge'
import { AlertPanel } from '@/components/AlertPanel'
import { Upload, FileUp } from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

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

    // Chart data
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
            .map(([name, v]) => ({ feature: name, reasons: v.reasons }))
        : []

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <span className="loader" />
            </div>
        )
    }

    return (
        <div className="relative min-h-screen">
            {/* Smoke Background */}
            <div className="fixed inset-0 z-0">
                <SmokeBackground smokeColor="#D97706" />
            </div>
            <div className="absolute inset-0 z-0 bg-black/60" />
            <div className="relative z-10 p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Drift Monitoring</h1>
                    <p className="text-sm text-[var(--muted-foreground)]">Upload production data and analyze feature drift</p>
                </div>

                {/* Upload + Score */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upload Panel */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Run Drift Check</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver
                                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                    : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
                                    }`}
                            >
                                <Upload className="mx-auto h-10 w-10 text-[var(--muted-foreground)] mb-3" />
                                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                                    Drag & drop a production CSV file here, or click to browse
                                </p>
                                <div>
                                    <input id="drift-file-upload" type="file" accept=".csv" onChange={handleInputChange} className="hidden" />
                                    <MetalButton variant="primary" disabled={uploading} onClick={() => document.getElementById('drift-file-upload')?.click() }>
                                        <FileUp className="h-4 w-4 mr-2" />
                                        {uploading ? 'Running...' : 'Upload & Run'}
                                    </MetalButton>
                                </div>
                            </div>
                            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                        </CardContent>
                    </Card>

                    {/* Drift Score */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Overall Drift Score</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <DriftScoreGauge score={driftScore} />
                        </CardContent>
                    </Card>
                </div>

                {/* Feature Drift Table */}
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
                                            <th className="text-left py-3 px-4 text-[var(--muted-foreground)] font-medium">Feature</th>
                                            <th className="text-left py-3 px-4 text-[var(--muted-foreground)] font-medium">Type</th>
                                            <th className="text-left py-3 px-4 text-[var(--muted-foreground)] font-medium">Baseline Mean</th>
                                            <th className="text-left py-3 px-4 text-[var(--muted-foreground)] font-medium">Prod Mean</th>
                                            <th className="text-left py-3 px-4 text-[var(--muted-foreground)] font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(report.feature_results).map(([name, f]) => (
                                            <tr key={name} className="border-b border-[var(--border)] hover:bg-[var(--secondary)]/50 transition-colors">
                                                <td className="py-3 px-4 font-medium">{name}</td>
                                                <td className="py-3 px-4">
                                                    <span className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-xs">{f.feature_type}</span>
                                                </td>
                                                <td className="py-3 px-4 text-[var(--muted-foreground)]">{fmtNum(f.baseline_mean)}</td>
                                                <td className="py-3 px-4 text-[var(--muted-foreground)]">{fmtNum(f.production_mean)}</td>
                                                <td className="py-3 px-4">
                                                    <StatusBadge status={f.drift_detected ? 'drift' : 'stable'} />
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
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                                    <Legend />
                                    <Bar dataKey="Baseline" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Production" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        {/* Categorical feature distributions */}
                        {categoricalData.map((data, index) => (
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
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                                        <Legend />
                                        <Bar dataKey="Baseline" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Production" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        ))}
                    </div>
                )}

                {/* Drift Alert Panel */}
                {report && (
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Drift Alerts</h2>
                        <AlertPanel alerts={alerts} />
                    </div>
                )}
            </div>
        </div>
    )
}
