import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-1/2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
               <Card className="lg:col-span-4 shadow-sm">
                    <CardHeader>
                        <Skeleton className="h-5 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
               </Card>
               <Card className="lg:col-span-3 shadow-sm">
                    <CardHeader>
                        <Skeleton className="h-5 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-[300px] mx-auto rounded-full" />
                    </CardContent>
               </Card>
            </div>
        </div>
    )
}
