import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GlowingCard } from '@/components/ui/glowing-card'
import { cn } from '@/lib/utils'

interface ChartContainerProps {
    title: string
    subtitle?: string
    children: React.ReactNode
    className?: string
}

export function ChartContainer({ title, subtitle, children, className }: ChartContainerProps) {
    return (
        <GlowingCard className={cn('p-0', className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                {subtitle && <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>}
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full">{children}</div>
            </CardContent>
        </GlowingCard>
    )
}

