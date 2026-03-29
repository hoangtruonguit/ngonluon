import MovieCardSkeleton from '@/components/movie/MovieCardSkeleton';

function SkeletonRow() {
    return (
        <section className="pl-6 lg:pl-24 max-w-[1440px] mx-auto overflow-hidden">
            <div className="flex items-end justify-between pr-6 lg:pr-24 mb-6">
                <div className="h-7 w-40 bg-white/10 rounded animate-pulse" />
                <div className="h-5 w-16 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="flex gap-6 overflow-hidden pb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <MovieCardSkeleton key={i} />
                ))}
            </div>
        </section>
    );
}

export default function Loading() {
    return (
        <>
            {/* Hero skeleton */}
            <div className="relative w-full h-[70vh] bg-white/5 animate-pulse" />

            <main className="relative z-20 space-y-16 pb-24 mt-12">
                {/* Categories skeleton */}
                <section className="px-6 lg:px-24 max-w-[1440px] mx-auto py-4">
                    <div className="flex gap-2 overflow-hidden">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-10 w-24 bg-white/10 rounded-xl animate-pulse flex-shrink-0" />
                        ))}
                    </div>
                </section>

                <SkeletonRow />
                <SkeletonRow />
            </main>
        </>
    );
}
