"use client";

import { Activity, AlertTriangle, Layers, Clock, TrendingDown } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

interface GlowingMetricsProps {
  healthStatus?: string;
  driftStatus?: string;
  driftScore?: number;
  featuresCount?: number;
  lastCheck?: string;
  lastCheckString?: string;
}

export function GlowingEffectDemo({
  healthStatus = "offline",
  driftStatus = "stable",
  driftScore = 0,
  featuresCount = 0,
  lastCheck = "N/A",
  lastCheckString = ""
}: GlowingMetricsProps) {
  const isHealthy = healthStatus === "healthy";
  const driftColorClass = driftStatus === "stable" ? "text-green-500" : driftStatus === "high-drift" ? "text-red-500" : "text-yellow-500";
  const healthColorClass = isHealthy ? "text-green-500" : "text-red-500";

  return (
    <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2 w-full lg:w-auto h-full m-0 p-0">
      {/* Model Status */}
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
        icon={<Activity className={`h-4 w-4 ${healthColorClass}`} />}
        title="Model Status"
        description={
            <span className="flex items-center gap-2">
                Server is currently <strong className={healthColorClass}>{isHealthy ? 'Online' : 'Offline'}</strong>
            </span>
        }
      />
      {/* Drift Status */}
      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
        icon={<TrendingDown className={`h-4 w-4 ${driftColorClass}`} />}
        title="Drift Status"
        description={
            <span className="flex items-center gap-2">
                Model predictions are <strong className={driftColorClass}>{driftStatus.replace('-', ' ')}</strong>
            </span>
        }
      />
      {/* Overall Score */}
      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
        icon={<AlertTriangle className={driftScore > 0 ? 'h-4 w-4 text-purple-500' : 'h-4 w-4 text-muted-foreground'} />}
        title="Drift Score"
        description={
            <div className="flex flex-col gap-1">
                <span>Current baseline divergence</span>
                <span className="text-2xl font-bold font-mono text-foreground text-purple-500">{(driftScore * 100).toFixed(1)}%</span>
            </div>
        }
      />
      {/* Monitored Features */}
      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
        icon={<Layers className="h-4 w-4 text-indigo-400" />}
        title="Features Monitored"
        description={
            <div className="flex flex-col gap-1">
                <span>Active tracked features</span>
                <span className="text-xl font-bold font-mono text-foreground">{featuresCount} features</span>
            </div>
        }
      />
      {/* Last Check */}
      <GridItem
        area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
        icon={<Clock className="h-4 w-4 text-blue-400" />}
        title="Last Checked"
        description={
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{lastCheck}</span>
            <span className="text-xs text-muted-foreground mt-1">{lastCheckString}</span>
          </div>
        }
      />
    </ul>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={cn("min-h-[14rem] list-none", area)}>
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                {title}
              </h3>
              <div className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                {description}
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
