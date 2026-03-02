import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewSessionLoading() {
  return (
    <DashboardLayout>
      <div>
        {/* Breadcrumb skeleton */}
        <div className="mb-6 flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Header skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>

        {/* Form skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Basic info */}
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              {/* Areas */}
              <div className="space-y-4">
                <Skeleton className="h-5 w-20" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </div>

              {/* Testers */}
              <div className="space-y-4">
                <Skeleton className="h-5 w-24" />
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
