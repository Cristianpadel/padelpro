"use client"

import { Skeleton } from "@/components/ui/skeleton";

const PageSkeleton = () => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-9 w-24" />
            </div>
            <Skeleton className="h-12 w-full" />
            <div className="flex gap-2">
                 <Skeleton className="h-10 w-32" />
                 <Skeleton className="h-10 w-32" />
            </div>
             <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] justify-center gap-6 mt-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-full max-w-sm mx-auto">
                        <Skeleton className="h-96 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PageSkeleton;
