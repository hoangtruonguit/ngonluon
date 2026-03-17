'use client';

import MovieCard from '@/components/MovieCard';
import { useTranslations } from 'next-intl';
import { WatchlistItemResponseDto } from '@/lib/api';

interface WatchlistSectionProps {
    items: WatchlistItemResponseDto[];
    isLoading: boolean;
    onWatchlistUpdate?: (movieId: string, isInWatchlist: boolean) => void;
}

export default function WatchlistSection({ items, isLoading, onWatchlistUpdate }: WatchlistSectionProps) {
    const t = useTranslations('Profile');
    const tCommon = useTranslations('Common');

    return (
        <section>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">bookmark</span>
                    {t('savedMovies')}
                </h2>
                <span className="text-white/40 text-sm font-medium">{t('itemsCount', { count: items.length })}</span>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="aspect-[2/3] rounded-3xl bg-white/5 animate-pulse"></div>
                    ))}
                </div>
            ) : items.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {items.map(item => (
                        <MovieCard
                            key={item.id}
                            id={item.movieId}
                            title={item.movie.title}
                            rating={item.movie.rating.toString()}
                            description={item.movie.description}
                            imageUrl={item.movie.thumbnailUrl || item.movie.posterUrl}
                            slug={item.movie.slug}
                            showWatchButton={true}
                            onWatchlistUpdate={onWatchlistUpdate}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center text-white/30 space-y-4">
                    <span className="material-symbols-outlined text-6xl block">movie</span>
                    <p className="font-medium">{t('emptyWatchlist')}</p>
                </div>
            )}
        </section>
    );
}
