'use client';

import HistoryCard from './HistoryCard';
import { apiClient, WatchHistoryResponseDto } from '@/lib/api';
import { useTranslations } from 'next-intl';

interface WatchHistorySectionProps {
    items: WatchHistoryResponseDto[];
    isLoading: boolean;
    onClear: () => void;
}

export default function WatchHistorySection({ items, isLoading, onClear }: WatchHistorySectionProps) {
    const t = useTranslations('Profile');

    const handleClear = async () => {
        if (confirm(t('confirmClearHistoryMsg'))) {
            try {
                await apiClient.clearWatchHistory();
                onClear();
            } catch (error) {
                console.error('Failed to clear watch history', error);
            }
        }
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">history</span>
                    {t('recentlyWatched')}
                </h2>
                {items.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="text-white/40 hover:text-red-400 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        {t('clearHistory')}
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-video rounded-2xl bg-white/5 animate-pulse"></div>
                    ))}
                </div>
            ) : items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map(item => (
                        <HistoryCard
                            key={item.id}
                            id={item.movieId}
                            title={item.movie?.title || ''}
                            imageUrl={item.movie?.thumbnailUrl || item.movie?.posterUrl || ''}
                            slug={item.movie?.slug || ''}
                            progressSeconds={item.progressSeconds}
                            durationMinutes={item.movie?.durationMinutes || 0}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center text-white/30 space-y-4">
                    <span className="material-symbols-outlined text-6xl block">play_circle</span>
                    <p className="font-medium">{t('emptyHistory')}</p>
                </div>
            )}
        </section>
    );
}
