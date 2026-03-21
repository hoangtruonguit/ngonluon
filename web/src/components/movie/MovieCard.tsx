'use client';

import Image from 'next/image';
import { movieService } from '@/services/movie.service';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';

interface MovieCardProps {
    id?: string;
    title: string;
    rating?: string;
    description: string;
    imageUrl: string;
    showWatchButton?: boolean;
    slug?: string;
    source?: 'local' | 'tmdb';
    onWatchlistUpdate?: (movieId: string, isInWatchlist: boolean) => void;
    releaseYear?: number | null;
    showYear?: boolean;
}


export default function MovieCard({
    id,
    title,
    rating,
    description,
    imageUrl,
    showWatchButton = false,
    slug,
    source = 'local',
    onWatchlistUpdate,
    releaseYear,
    showYear = false
}: MovieCardProps) {
    const highResImageUrl = movieService.getHighResImage(imageUrl);
    const router = useRouter();
    const { isLoggedIn, watchlistIds, updateWatchlist, openLoginPrompt } = useAuth();
    const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
    const t = useTranslations('Common');

    const isInWatchlist = id ? watchlistIds.has(id) : false;

    const handleWatchlistToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isLoggedIn) {
            openLoginPrompt();
            return;
        }

        if (!id) return;

        setIsWatchlistLoading(true);
        try {
            if (isInWatchlist) {
                await apiClient.removeFromWatchlist(id);
                updateWatchlist(id, false);
                if (onWatchlistUpdate) onWatchlistUpdate(id, false);
            } else {
                await apiClient.addToWatchlist(id);
                updateWatchlist(id, true);
                if (onWatchlistUpdate) onWatchlistUpdate(id, true);
            }
        } catch (error) {
            console.error('Failed to toggle watchlist:', error);
        } finally {
            setIsWatchlistLoading(false);
        }
    };

    const card = (
        <div 
            className="movie-card relative min-w-[200px] lg:min-w-[240px] aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group shadow-2xl flex-shrink-0"
            onClick={() => {
                if (slug) {
                    router.push(`/watch/${slug}`);
                }
            }}
        >
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                <Image 
                    src={highResImageUrl} 
                    alt={title} 
                    fill 
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 250px" 
                    className="object-cover"
                    unoptimized={highResImageUrl.includes('placehold.co')}
                />
            </div>

            <div className="card-overlay absolute inset-0 bg-black/80 transition-opacity duration-300 flex flex-col justify-end p-6 space-y-3 opacity-0 group-hover:opacity-100">
                {rating && (
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <span className="text-primary font-black text-lg">{rating}</span>
                            <span className="text-white/50 text-[10px] uppercase font-black tracking-widest">IMDb</span>
                        </div>
                        {showYear && releaseYear && (
                            <div className="flex items-center gap-1.5 opacity-80">
                                <span className="material-symbols-outlined text-[14px] text-primary/80">calendar_today</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-white/60">
                                    {releaseYear}
                                </span>
                            </div>
                        )}
                    </div>
                )}
                <div className="space-y-1">
                    <h4 className="text-white font-bold text-xl line-clamp-2 leading-tight">{title}</h4>
                    {showYear && releaseYear && (
                        <p className="text-[10px] font-bold text-primary/80 uppercase tracking-widest">
                            {t('releasedYear', { year: releaseYear })}
                        </p>
                    )}
                </div>
                <p className="text-white/70 text-xs line-clamp-2">{description}</p>
                
                <div className="flex flex-col gap-2 w-full">
                    {showWatchButton && slug && (
                        <button
                            className="w-full bg-primary py-2 rounded-lg text-white text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/watch/${slug}`);
                            }}
                        >
                            {t('watchNow')}
                        </button>
                    )}
                    {source === 'local' && id && (
                        <button
                            className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                isInWatchlist
                                    ? 'bg-white/10 text-white hover:bg-white/20'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                            onClick={handleWatchlistToggle}
                            disabled={isWatchlistLoading}
                        >
                            {isWatchlistLoading ? (
                                <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <span>{isInWatchlist ? `✓ ${t('inMyList')}` : `+ ${t('myList')}`}</span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return card;
}
