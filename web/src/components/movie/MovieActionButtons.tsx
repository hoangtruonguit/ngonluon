'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';

interface MovieActionButtonsProps {
    movieId: string;
    movieSlug: string;
    showDetails?: boolean;
}

export default function MovieActionButtons({ movieId, movieSlug, showDetails = false }: MovieActionButtonsProps) {
    const { isLoggedIn, watchlistIds, updateWatchlist, openLoginPrompt } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const t = useTranslations('Common');

    const isInWatchlist = watchlistIds.has(movieId);

    const handleWatchlistToggle = async () => {
        if (!isLoggedIn) {
            openLoginPrompt();
            return;
        }

        setIsLoading(true);
        try {
            if (isInWatchlist) {
                await apiClient.removeFromWatchlist(movieId);
                updateWatchlist(movieId, false);
            } else {
                await apiClient.addToWatchlist(movieId);
                updateWatchlist(movieId, true);
            }
        } catch (error) {
            console.error('Failed to toggle watchlist:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                url: window.location.href,
            }).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href)
                .then(() => alert(t('linkCopied') || 'Link copied to clipboard!'))
                .catch(console.error);
        }
    };

    return (
        <div className="flex flex-wrap gap-4 pt-4">
            <Link href={`/watch/${movieSlug}`}>
                <button className="bg-primary text-secondary px-10 py-4 rounded-xl font-bold flex items-center gap-3 hover:scale-105 transition-transform duration-300">
                    <span className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-secondary border-b-[8px] border-b-transparent ml-1" />
                    {t('watchNow')}
                </button>
            </Link>
            {showDetails && (
                <Link href={`/movies/${movieSlug}`}>
                    <button className="bg-white/10 text-white backdrop-blur-md px-10 py-4 rounded-xl font-bold hover:bg-white/20 transition-all duration-300">
                        {t('details')}
                    </button>
                </Link>
            )}
            
            <button 
                onClick={handleWatchlistToggle}
                disabled={isLoading}
                className={`bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-xl font-bold flex items-center gap-2 backdrop-blur-md transition-all ${
                    isInWatchlist ? 'text-primary' : ''
                }`}
            >
                {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <>
                        <span className="material-symbols-outlined">
                            {isInWatchlist ? 'check' : 'add'}
                        </span>
                        {isInWatchlist ? t('inMyList') : t('myList')}
                    </>
                )}
            </button>

            <button 
                onClick={handleShare}
                className="size-12 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
            >
                <span className="material-symbols-outlined">share</span>
            </button>
        </div>
    );
}
