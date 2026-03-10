import { useEffect, useState } from 'react'
import { getHealth, getModelInfo, type ModelInfo } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { Server, Cpu, Gauge, Clock } from 'lucide-react'

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
            <div className="flex h-full items-center justify-center">
                <span className="loader" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-sm text-[var(--muted-foreground)]">API configuration and model details</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API Config */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Server className="h-4 w-4" /> API Configuration
                        </CardTitle>
                        <CardDescription>Backend connection details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg bg-[var(--secondary)] px-4 py-3">
                            <div>
                                <p className="text-xs text-[var(--muted-foreground)]">Backend URL</p>
                                <p className="text-sm font-mono">http://localhost:8000</p>
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
                        <CardTitle className="text-base flex items-center gap-2">
                            <Cpu className="h-4 w-4" /> Model Details
                        </CardTitle>
                        <CardDescription>Trained model metadata</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {model && (
                            <>
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
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Metrics */}
                {model && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Gauge className="h-4 w-4" /> Evaluation Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(model.metrics).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <span className="text-sm text-[var(--muted-foreground)]">{key.replace(/_/g, ' ')}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-2 rounded-full bg-[var(--secondary)]">
                                                <div
                                                    className="h-full rounded-full bg-[var(--primary)]"
                                                    style={{ width: `${Math.min(val * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium w-14 text-right">{(val * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Hyperparameters */}
                {model && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Hyperparameters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--border)]">
                                            <th className="text-left py-2 px-3 text-[var(--muted-foreground)] font-medium">Parameter</th>
                                            <th className="text-left py-2 px-3 text-[var(--muted-foreground)] font-medium">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(model.rf_params).map(([key, val]) => (
                                            <tr key={key} className="border-b border-[var(--border)]">
                                                <td className="py-2 px-3 font-mono text-xs">{key}</td>
                                                <td className="py-2 px-3">{String(val)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
