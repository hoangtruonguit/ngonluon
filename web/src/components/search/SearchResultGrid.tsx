'use client';

import Image from 'next/image';
import { SearchResult } from '@/services/search.service';

export const SearchSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="flex flex-col gap-4 animate-pulse">
                <div className="aspect-[2/3] w-full rounded-2xl bg-white/5"></div>
                <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-white/5 rounded"></div>
                    <div className="h-3 w-1/2 bg-white/5 rounded"></div>
                </div>
            </div>
        ))}
    </div>
);

interface SearchResultGridProps {
    results: SearchResult[];
    isLoading: boolean;
    importingId: number | null;
    onImport: (tmdbId: number) => void;
    onWatch: (slug: string) => void;
    query: string;
    onClearFilters: () => void;
}

export default function SearchResultGrid({
    results,
    isLoading,
    importingId,
    onImport,
    onWatch,
    query,
    onClearFilters
}: SearchResultGridProps) {
    if (isLoading) return <SearchSkeleton />;

    if (results.length === 0) {
        if (query) {
            return (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white/[0.02] rounded-3xl border border-white/5">
                    <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl text-primary">search_off</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
                    <p className="text-white/40 max-w-md">We couldn't find anything matching "{query}". Try adjusting your filters or checking your spelling.</p>
                    <button onClick={onClearFilters} className="mt-8 text-primary font-bold hover:underline">Clear all filters</button>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-white/[0.02] rounded-3xl border border-white/5">
                <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-bounce">
                    <span className="material-symbols-outlined text-4xl text-primary">explore</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ready to explore?</h3>
                <p className="text-white/40 max-w-md">Type a movie title, actor, or genre name in the search bar above to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 gap-y-8">
            {results.map((movie) => (
                <div key={`${movie.source}-${movie.id}`} className="group relative flex flex-col gap-4">
                    <div className="aspect-[2/3] relative rounded-2xl overflow-hidden bg-white/5 shadow-lg group-hover:shadow-primary/20 group-hover:ring-2 group-hover:ring-primary transition-all duration-500">
                        <Image 
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700" 
                            src={movie.posterUrl || 'https://placehold.co/400x600/1a1a1a/444444?text=No+Poster'} 
                            alt={movie.title}
                            unoptimized
                        />
                        <div className="poster-overlay absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-5">
                            {importingId === movie.tmdbId ? (
                                <div className="flex flex-col items-center gap-3 py-4">
                                    <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">Crawling Content...</span>
                                </div>
                            ) : movie.source === 'local' ? (
                                <button 
                                    onClick={() => movie.slug && onWatch(movie.slug)}
                                    className="w-full bg-primary py-3 rounded-xl font-bold text-xs uppercase tracking-widest mb-2 flex items-center justify-center gap-2 text-white shadow-xl shadow-primary/30 active:scale-95 transition-transform"
                                >
                                    <span className="material-symbols-outlined text-[18px]">play_arrow</span> Watch Now
                                </button>
                            ) : (
                                <button 
                                    onClick={() => movie.tmdbId && onImport(movie.tmdbId)}
                                    className="w-full bg-white text-black py-3 rounded-xl font-bold text-xs uppercase tracking-widest mb-2 flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform"
                                >
                                    <span className="material-symbols-outlined text-[18px]">download</span> Import
                                </button>
                            )}
                        </div>
                        
                        <div className="absolute top-4 inset-x-4 flex justify-between pointer-events-none">
                            {movie.rating > 0 && (
                                <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10">
                                    <span className="material-symbols-outlined text-[14px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    <span className="text-[10px] font-black text-white">{movie.rating.toFixed(1)}</span>
                                </div>
                            )}
                            {movie.source === 'tmdb' && (
                                <div className="ml-auto bg-primary/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest text-white border border-white/20">
                                    TMDB
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-bold text-sm sm:text-base truncate group-hover:text-primary transition-colors cursor-pointer" title={movie.title}>{movie.title}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-white/40 text-[10px] font-bold uppercase">{movie.releaseYear}</span>
                            <span className="text-white/10">•</span>
                            <span className="text-white/40 text-[10px] font-bold uppercase truncate max-w-[120px]">{movie.genres[0] || 'Movie'}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
