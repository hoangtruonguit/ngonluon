export default function MovieCardSkeleton() {
    return (
        <div className="movie-card relative min-w-[200px] lg:min-w-[240px] aspect-[2/3] rounded-xl overflow-hidden flex-shrink-0 animate-pulse">
            <div className="absolute inset-0 bg-white/5" />
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                <div className="h-2 bg-white/10 rounded w-1/3" />
                <div className="h-2 bg-white/10 rounded w-3/4" />
                <div className="h-2 bg-white/10 rounded w-1/2" />
            </div>
        </div>
    );
}
