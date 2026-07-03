import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, AlertOctagon } from 'lucide-react'
import type { Severity } from '@/lib/api'

interface AlertItem {
    feature: string
    reasons: string[]
    severity?: Severity
}

interface AlertPanelProps {
    alerts: AlertItem[]
}

export function AlertPanel({ alerts }: AlertPanelProps) {
    if (alerts.length === 0) {
        return (
            <Card>
                <CardContent className="p-5 text-center text-[var(--muted-foreground)]">
                    <p className="text-sm">No drift alerts - all features are stable.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-3">
            {alerts.map((alert) => {
                const critical = alert.severity === 'critical'
                const color = critical ? 'var(--critical)' : 'var(--warning)'
                const Icon = critical ? AlertOctagon : AlertTriangle
                return (
                    <Card
                        key={alert.feature}
                        style={{
                            borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                            backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)`,
                        }}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color }} />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold" style={{ color }}>
                                        {alert.feature}
                                        {critical && (
                                            <span
                                                className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                                                style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
                                            >
                                                critical
                                            </span>
                                        )}
                                    </p>
                                    {alert.reasons.map((reason, i) => (
                                        <p key={i} className="text-xs text-[var(--muted-foreground)]">&bull; {reason}</p>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
