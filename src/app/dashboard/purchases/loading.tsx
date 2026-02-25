import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <TableSkeleton columns={6} rows={5} />
        </div>
    );
}
