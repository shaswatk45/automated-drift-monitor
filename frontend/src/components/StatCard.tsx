import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: LucideIcon
    trend?: 'up' | 'down' | 'neutral'
    accentColor?: string
    className?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, accentColor, className }: StatCardProps) {
    return (
        <Card className={cn('relative overflow-hidden', className)}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{title}</p>
                        <p className="text-2xl font-bold" style={accentColor ? { color: accentColor } : undefined}>
                            {value}
                        </p>
                        {subtitle && <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>}
                    </div>
                    <div
                        className="rounded-lg p-2.5"
                        style={{ backgroundColor: accentColor ? `color-mix(in srgb, ${accentColor} 15%, transparent)` : 'var(--secondary)' }}
                    >
                        <Icon className="h-5 w-5" style={accentColor ? { color: accentColor } : { color: 'var(--muted-foreground)' }} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
