'use client';

import Image from 'next/image';
import { SearchResult } from '@/services/search.service';
import MovieCard from '@/components/MovieCard';
import { useTranslations } from 'next-intl';

export const SearchSkeleton = () => (
// ... (rest same)
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
    const t = useTranslations('Search');
    if (isLoading) return <SearchSkeleton />;

    if (results.length === 0) {
        if (query) {
            return (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white/[0.02] rounded-3xl border border-white/5">
                    <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl text-primary">search_off</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('noResultsFound')}</h3>
                    <p className="text-white/40 max-w-md">{t('noResultsMessage', { query: query })}</p>
                    <button onClick={onClearFilters} className="mt-8 text-primary font-bold hover:underline">{t('clearAllFilters')}</button>
                </div>
            );
        }
        return null; // Don't show "Ready to explore" if it's already handled by the layout or toolbar
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 gap-y-8">
            {results.map((movie) => (
                <MovieCard
                    key={`${movie.source}-${movie.id}`}
                    id={movie.id}
                    title={movie.title}
                    rating={movie.rating > 0 ? movie.rating.toFixed(1) : undefined}
                    description={""}
                    imageUrl={movie.posterUrl || 'https://placehold.co/400x600/1a1a1a/444444?text=No+Poster'}
                    showWatchButton={movie.source === 'local'}
                    slug={movie.slug}
                    source={movie.source}
                    onImport={() => movie.tmdbId && onImport(movie.tmdbId)}
                />
            ))}
        </div>
    );
}
