import { useEffect, useState } from 'react'
import { SmokeBackground } from '@/components/ui/spooky-smoke-animation'
import {
    listReports, getReport, deleteReport, reportDownloadUrl, fmtNum,
    type ReportListItem, type DriftReport,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { cn } from '@/lib/utils'
import { FileText, X, Trash2, Download } from 'lucide-react'

export default function Reports() {
    const [reports, setReports] = useState<ReportListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedReport, setSelectedReport] = useState<DriftReport | null>(null)
    const [selectedName, setSelectedName] = useState<string | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)

    const loadReports = () =>
        listReports()
            .then((data) => setReports(data.reports))
            .catch(() => { })
            .finally(() => setLoading(false))

    useEffect(() => {
        loadReports()
    }, [])

    const handleDelete = async (filename: string) => {
        if (!window.confirm(`Delete ${filename}? This cannot be undone.`)) return
        setDeleting(filename)
        try {
            await deleteReport(filename)
            if (selectedName === filename) {
                setSelectedReport(null)
                setSelectedName(null)
            }
            await loadReports()
        } catch {
            // ignore — the list simply won't change
        } finally {
            setDeleting(null)
        }
    }

    const openReport = async (filename: string) => {
        setDetailLoading(true)
        setSelectedName(filename)
        try {
            const report = await getReport(filename)
            setSelectedReport(report)
        } catch {
            // ignore
        } finally {
            setDetailLoading(false)
        }
    }

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
                <SmokeBackground smokeColor="#3B82F6" />
            </div>
            <div className="absolute inset-0 z-0 bg-black/60" />
            <div className="relative z-10 p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Drift Reports</h1>
                    <p className="text-sm text-[var(--muted-foreground)]">{reports.length} reports available</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Reports Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">All Reports</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reports.length === 0 ? (
                                <p className="text-sm text-[var(--muted-foreground)] text-center py-8">No reports found.</p>
                            ) : (
                                <div className="space-y-1">
                                    {reports.map((r) => (
                                        <div
                                            key={r.filename}
                                            className={cn(
                                                'w-full flex items-center gap-3 rounded-lg px-3 py-3 transition-colors group',
                                                selectedName === r.filename ? 'bg-[var(--secondary)]' : 'hover:bg-[var(--secondary)]'
                                            )}
                                        >
                                            <button
                                                onClick={() => openReport(r.filename)}
                                                className="flex items-center gap-3 flex-1 min-w-0 text-left"
                                            >
                                                <FileText className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{r.filename}</p>
                                                    <p className="text-xs text-[var(--muted-foreground)]">
                                                        {new Date(r.created_at * 1000).toLocaleString()} •{' '}
                                                        {(r.file_size_bytes / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                            </button>
                                            <a
                                                href={reportDownloadUrl(r.filename)}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Download report"
                                                className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors p-1"
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(r.filename)}
                                                disabled={deleting === r.filename}
                                                title="Delete report"
                                                className="text-[var(--muted-foreground)] hover:text-[var(--critical)] transition-colors p-1 disabled:opacity-40"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Report Detail */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                    {selectedReport ? 'Report Details' : 'Select a Report'}
                                </CardTitle>
                                {selectedReport && (
                                    <button
                                        onClick={() => setSelectedReport(null)}
                                        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {detailLoading && (
                                <div className="flex justify-center py-8">
                                    <span className="loader" />
                                </div>
                            )}
                            {!selectedReport && !detailLoading && (
                                <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
                                    Click a report to view its details
                                </p>
                            )}
                            {selectedReport && !detailLoading && (
                                <div className="space-y-4">
                                    {/* Summary */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-lg bg-[var(--secondary)] p-3">
                                            <p className="text-xs text-[var(--muted-foreground)]">Timestamp</p>
                                            <p className="text-sm font-medium">{new Date(selectedReport.timestamp).toLocaleString()}</p>
                                        </div>
                                        <div className="rounded-lg bg-[var(--secondary)] p-3">
                                            <p className="text-xs text-[var(--muted-foreground)]">Dataset Size</p>
                                            <p className="text-sm font-medium">{selectedReport.dataset_size} rows</p>
                                        </div>
                                        <div className="rounded-lg bg-[var(--secondary)] p-3">
                                            <p className="text-xs text-[var(--muted-foreground)]">Overall Drift</p>
                                            <StatusBadge status={selectedReport.overall_drift ? 'drift' : 'stable'} />
                                        </div>
                                        <div className="rounded-lg bg-[var(--secondary)] p-3">
                                            <p className="text-xs text-[var(--muted-foreground)]">Drifted Features</p>
                                            <p className="text-sm font-medium">
                                                {selectedReport.summary.drifted_count} / {selectedReport.summary.total_features}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Feature Results */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Feature Results</p>
                                        <div className="max-h-[400px] overflow-y-auto space-y-1.5">
                                            {Object.entries(selectedReport.feature_results).map(([name, f]) => (
                                                <div key={name} className="flex items-center justify-between rounded-lg bg-[var(--secondary)]/50 px-3 py-2">
                                                    <div>
                                                        <p className="text-sm font-medium">{name}</p>
                                                        <p className="text-xs text-[var(--muted-foreground)]">
                                                            {f.feature_type} • Baseline: {fmtNum(f.baseline_mean)} → Prod: {fmtNum(f.production_mean)}
                                                        </p>
                                                    </div>
                                                    <StatusBadge status={f.drift_detected ? 'drift' : 'stable'} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
