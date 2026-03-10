import { useEffect, useState } from 'react'
import {
    listReports, getReport,
    type ReportListItem, type DriftReport,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { FileText, X, ChevronRight } from 'lucide-react'

export default function Reports() {
    const [reports, setReports] = useState<ReportListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedReport, setSelectedReport] = useState<DriftReport | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)

    useEffect(() => {
        listReports()
            .then((data) => setReports(data.reports))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const openReport = async (filename: string) => {
        setDetailLoading(true)
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
        <div className="p-6 space-y-6">
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
                                    <button
                                        key={r.filename}
                                        onClick={() => openReport(r.filename)}
                                        className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-[var(--secondary)] transition-colors group"
                                    >
                                        <FileText className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{r.filename}</p>
                                            <p className="text-xs text-[var(--muted-foreground)]">
                                                {new Date(r.created_at * 1000).toLocaleString()} •{' '}
                                                {(r.file_size_bytes / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
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
                                                        {f.feature_type} • Baseline: {f.baseline_mean.toFixed(4)} → Prod: {f.production_mean.toFixed(4)}
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
    )
}
