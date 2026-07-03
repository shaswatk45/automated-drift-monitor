import { useEffect, useState } from 'react'
import { getHealth, getModelInfo, type ModelInfo } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { PageShell, PageHeader } from '@/components/PageShell'
import { Server, Cpu, Gauge, Clock, Settings as SettingsIcon, BarChart3 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export default function Settings() {
    const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null)
    const [model, setModel] = useState<ModelInfo | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.allSettled([getHealth(), getModelInfo()])
            .then(([h, m]) => {
                if (h.status === 'fulfilled') setHealth(h.value)
                if (m.status === 'fulfilled') setModel(m.value)
            })
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <span className="loader" />
            </div>
        )
    }

    // Top-8 feature importances, sorted descending
    const importances = model?.feature_importance
        ? Object.entries(model.feature_importance)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
        : []
    const maxImportance = importances.length ? importances[0][1] : 1

    return (
        <PageShell>
            <PageHeader
                icon={SettingsIcon}
                title="Settings"
                subtitle="API configuration, model details, and training metadata"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API Config */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Server className="h-4 w-4 text-[var(--primary)]" /> API Configuration
                        </CardTitle>
                        <CardDescription>Backend connection details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg bg-[var(--secondary)] px-4 py-3">
                            <div>
                                <p className="text-xs text-[var(--muted-foreground)]">Backend URL</p>
                                <p className="font-mono text-sm">{API_URL}</p>
                            </div>
                            {health && <StatusBadge status={health.status === 'healthy' ? 'healthy' : 'unhealthy'} />}
                        </div>
                        {health && (
                            <div className="flex items-center gap-2 rounded-lg bg-[var(--secondary)] px-4 py-3">
                                <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
                                <div>
                                    <p className="text-xs text-[var(--muted-foreground)]">Last Health Check</p>
                                    <p className="text-sm">{new Date(health.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Model Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Cpu className="h-4 w-4 text-[var(--primary)]" /> Model Details
                        </CardTitle>
                        <CardDescription>Trained model metadata</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {model && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-[var(--secondary)] p-3">
                                    <p className="text-xs text-[var(--muted-foreground)]">Version</p>
                                    <p className="text-sm font-medium">v{model.model_version}</p>
                                </div>
                                <div className="rounded-lg bg-[var(--secondary)] p-3">
                                    <p className="text-xs text-[var(--muted-foreground)]">Trained At</p>
                                    <p className="text-sm font-medium">{new Date(model.trained_at).toLocaleDateString()}</p>
                                </div>
                                <div className="rounded-lg bg-[var(--secondary)] p-3">
                                    <p className="text-xs text-[var(--muted-foreground)]">Features</p>
                                    <p className="text-sm font-medium">{model.feature_names.length}</p>
                                </div>
                                <div className="rounded-lg bg-[var(--secondary)] p-3">
                                    <p className="text-xs text-[var(--muted-foreground)]">Algorithm</p>
                                    <p className="text-sm font-medium">Random Forest</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Metrics */}
                {model && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Gauge className="h-4 w-4 text-[var(--primary)]" /> Evaluation Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(model.metrics).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <span className="text-sm text-[var(--muted-foreground)]">{key.replace(/_/g, ' ')}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-32 rounded-full bg-[var(--secondary)]">
                                                <div
                                                    className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
                                                    style={{ width: `${Math.min(val * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="w-14 text-right text-sm font-medium tabular-nums">{(val * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Feature importance */}
                {importances.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 className="h-4 w-4 text-[var(--primary)]" /> Feature Importance
                            </CardTitle>
                            <CardDescription>What the model relies on most (global)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2.5">
                                {importances.map(([name, val]) => (
                                    <div key={name} className="flex items-center gap-3">
                                        <span className="w-36 truncate text-xs text-[var(--muted-foreground)]">{name.replace(/_/g, ' ')}</span>
                                        <div className="h-2 flex-1 rounded-full bg-[var(--secondary)]">
                                            <div
                                                className="h-full rounded-full bg-[var(--chart-2)] transition-all duration-700"
                                                style={{ width: `${(val / maxImportance) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-12 text-right text-xs font-medium tabular-nums">{(val * 100).toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Hyperparameters */}
                {model && (
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Hyperparameters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {Object.entries(model.rf_params).map(([key, val]) => (
                                    <div key={key} className="rounded-lg bg-[var(--secondary)] px-3 py-2.5">
                                        <p className="font-mono text-xs text-[var(--muted-foreground)]">{key}</p>
                                        <p className="text-sm font-medium">{String(val)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageShell>
    )
}
