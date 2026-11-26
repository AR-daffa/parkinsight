import { Skeleton } from "@/components/ui/Skeleton";

export default function PublicLoading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
