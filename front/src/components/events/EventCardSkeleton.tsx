import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const EventCardSkeleton = () => (
  <Card className="overflow-hidden border-border/70">
    <div className="h-1.5 w-full bg-gradient-to-r from-primary/35 via-primary/15 to-transparent" />
    <CardContent className="space-y-4 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />

      <div className="grid gap-2 sm:grid-cols-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>

      <div className="space-y-2 rounded-xl border border-border/60 p-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </CardContent>
  </Card>
);

export default EventCardSkeleton;
