import { useEffect, useState } from 'react'
import {
    listReports, getReport, deleteReport, reportDownloadUrl, fmtNum, featureSeverity,
    type ReportListItem, type DriftReport,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { PageShell, PageHeader } from '@/components/PageShell'
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
            // ignore - the list simply won't change
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
            <div className="flex h-[60vh] items-center justify-center">
                <span className="loader" />
            </div>
        )
    }

    const score = selectedReport?.drift_score ?? null

    return (
        <PageShell>
            <PageHeader
                icon={FileText}
                title="Drift Reports"
                subtitle={`${reports.length} report${reports.length === 1 ? '' : 's'} available - click one to inspect, download, or delete`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reports list */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">All Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {reports.length === 0 ? (
                            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">No reports found.</p>
                        ) : (
                            <div className="space-y-1">
                                {reports.map((r) => (
                                    <div
                                        key={r.filename}
                                        className={cn(
                                            'group flex w-full items-center gap-3 rounded-lg px-3 py-3 transition-colors',
                                            selectedName === r.filename
                                                ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/20'
                                                : 'hover:bg-[var(--secondary)] border border-transparent'
                                        )}
                                    >
                                        <button
                                            onClick={() => openReport(r.filename)}
                                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                        >
                                            <FileText className={cn(
                                                'h-4 w-4 shrink-0',
                                                selectedName === r.filename ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
                                            )} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{r.filename}</p>
                                                <p className="text-xs text-[var(--muted-foreground)]">
                                                    {new Date(r.created_at * 1000).toLocaleString()} &middot;{' '}
                                                    {(r.file_size_bytes / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </button>
                                        <a
                                            href={reportDownloadUrl(r.filename)}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="Download report"
                                            className="p-1 text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
                                        >
                                            <Download className="h-4 w-4" />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(r.filename)}
                                            disabled={deleting === r.filename}
                                            title="Delete report"
                                            className="p-1 text-[var(--muted-foreground)] transition-colors hover:text-[var(--critical)] disabled:opacity-40"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Report detail */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                                {selectedReport ? 'Report Details' : 'Select a Report'}
                            </CardTitle>
                            {selectedReport && (
                                <button
                                    onClick={() => { setSelectedReport(null); setSelectedName(null) }}
                                    className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
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
                            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                                Click a report to view its details
                            </p>
                        )}
                        {selectedReport && !detailLoading && (
                            <div className="space-y-4">
                                {/* Summary grid */}
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
                                        <p className="text-xs text-[var(--muted-foreground)]">Drift Score</p>
                                        <p className="text-sm font-bold tabular-nums">
                                            {score != null ? `${(score * 100).toFixed(1)}%` : 'n/a'}
                                            <span className="ml-2 font-normal text-xs text-[var(--muted-foreground)]">
                                                {selectedReport.summary.drifted_count} / {selectedReport.summary.total_features} drifted
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Severity breakdown */}
                                {(selectedReport.summary.critical_count != null) && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="rounded-full bg-[var(--critical)]/10 px-2.5 py-1 font-semibold text-[var(--critical)]">
                                            {selectedReport.summary.critical_count} critical
                                        </span>
                                        <span className="rounded-full bg-[var(--warning)]/10 px-2.5 py-1 font-semibold text-[var(--warning)]">
                                            {selectedReport.summary.warning_count ?? 0} warning
                                        </span>
                                        <span className="rounded-full bg-[var(--success)]/10 px-2.5 py-1 font-semibold text-[var(--success)]">
                                            {selectedReport.summary.stable_count} stable
                                        </span>
                                    </div>
                                )}

                                {/* Feature results */}
                                <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Feature Results</p>
                                    <div className="max-h-[400px] space-y-1.5 overflow-y-auto pr-1">
                                        {Object.entries(selectedReport.feature_results).map(([name, f]) => (
                                            <div key={name} className="flex items-center justify-between rounded-lg bg-[var(--secondary)]/50 px-3 py-2">
                                                <div>
                                                    <p className="text-sm font-medium">{name}</p>
                                                    <p className="text-xs text-[var(--muted-foreground)]">
                                                        {f.feature_type} &middot; Baseline: {fmtNum(f.baseline_mean)} &rarr; Prod: {fmtNum(f.production_mean)}
                                                    </p>
                                                </div>
                                                <StatusBadge status={featureSeverity(f)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageShell>
    )
}
