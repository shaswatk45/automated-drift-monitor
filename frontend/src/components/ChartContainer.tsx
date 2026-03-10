import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChartContainerProps {
    title: string
    subtitle?: string
    children: React.ReactNode
    className?: string
}

export function ChartContainer({ title, subtitle, children, className }: ChartContainerProps) {
    return (
        <Card className={cn('', className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                {subtitle && <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>}
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full">{children}</div>
            </CardContent>
        </Card>
    )
}
