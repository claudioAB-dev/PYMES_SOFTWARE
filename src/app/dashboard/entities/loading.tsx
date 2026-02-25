import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <TableSkeleton columns={5} rows={5} />
        </div>
    );
}
