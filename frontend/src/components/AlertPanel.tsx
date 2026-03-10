import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

interface AlertPanelProps {
    alerts: { feature: string; reasons: string[] }[]
}

export function AlertPanel({ alerts }: AlertPanelProps) {
    if (alerts.length === 0) {
        return (
            <Card>
                <CardContent className="p-5 text-center text-[var(--muted-foreground)]">
                    <p className="text-sm">No drift alerts — all features are stable.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-3">
            {alerts.map((alert) => (
                <Card key={alert.feature} className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-amber-300">{alert.feature}</p>
                                {alert.reasons.map((reason, i) => (
                                    <p key={i} className="text-xs text-[var(--muted-foreground)]">• {reason}</p>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
