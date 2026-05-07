import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Activity, type LucideIcon, Users } from "lucide-react"
import { Suspense } from "react"

import { MetricsService, UsersService } from "@/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ForbiddenError } from "@/lib/errors"
import { hasPermission } from "@/lib/permissions"

function getMetricsQueryOptions() {
  return {
    queryFn: MetricsService.readMetrics,
    queryKey: ["metrics"],
  }
}

export const Route = createFileRoute("/_layout/metrics")({
  component: Metrics,
  beforeLoad: async () => {
    const user = await UsersService.readUserMe()
    if (!hasPermission(user.permissions, "metrics:read")) {
      throw new ForbiddenError()
    }
  },
  head: () => ({
    meta: [
      {
        title: "Metrics - FastAPI Template",
      },
    ],
  }),
})

function MetricsCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: number
  description: string
  icon: LucideIcon
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function MetricsContent() {
  const { data: metrics } = useSuspenseQuery(getMetricsQueryOptions())

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MetricsCard
        title="Active Users"
        value={metrics.active_users}
        description="Enabled user accounts"
        icon={Activity}
      />
      <MetricsCard
        title="Total Users"
        value={metrics.total_users}
        description="All registered users"
        icon={Users}
      />
    </div>
  )
}

function MetricsFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  )
}

function Metrics() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Metrics</h1>
        <p className="text-muted-foreground">User account totals</p>
      </div>
      <Suspense fallback={<MetricsFallback />}>
        <MetricsContent />
      </Suspense>
    </div>
  )
}
