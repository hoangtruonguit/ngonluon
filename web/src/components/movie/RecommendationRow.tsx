'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import {
    recommendationService,
    type MovieRecommendation,
} from '@/services/recommendation.service';

type RowType = 'for-you' | 'trending-for-you' | 'because-you-watched';

interface RecommendationRowProps {
    type: RowType;
    /** Required when type === 'because-you-watched' */
    sourceMovieId?: string;
    limit?: number;
}

function ScoreBadge({ score }: { score: number }) {
    if (score === 0) return null;
    const pct = Math.round(score * 100);
    const color =
        pct >= 80 ? 'text-green-400 border-green-400/30 bg-green-400/10'
        : pct >= 60 ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
        : 'text-slate-400 border-slate-400/30 bg-slate-400/10';
    return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color}`}>
            {pct}%
        </span>
    );
}

function SkeletonCard() {
    return (
        <div className="shrink-0 w-40 md:w-48 animate-pulse">
            <div className="w-full aspect-[2/3] rounded-xl bg-white/5 mb-2" />
            <div className="h-3 bg-white/5 rounded w-3/4 mb-1" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
        </div>
    );
}

function RecCard({ rec }: { rec: MovieRecommendation }) {
    const { movie, score, reason } = rec;
    return (
        <Link
            href={`/movies/${movie.slug}`}
            className="shrink-0 w-40 md:w-48 group"
        >
            <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden border border-white/5 mb-2 bg-white/5">
                {movie.posterUrl ? (
                    <Image
                        src={movie.posterUrl}
                        alt={movie.title}
                        fill
                        sizes="192px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-4xl font-bold">
                        {movie.title.charAt(0)}
                    </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Premium badge */}
                {movie.isPremium && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-yellow-500/20 text-[10px] font-bold uppercase text-yellow-400 border border-yellow-500/20">
                        Premium
                    </span>
                )}

                {/* Score badge */}
                <div className="absolute top-2 right-2">
                    <ScoreBadge score={score} />
                </div>
            </div>

            <h4 className="text-sm font-semibold text-white/90 truncate group-hover:text-primary transition-colors">
                {movie.title}
            </h4>
            {reason ? (
                <p className="text-[11px] text-slate-500 truncate">{reason}</p>
            ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                    {movie.releaseYear && (
                        <span className="text-[11px] text-slate-500">{movie.releaseYear}</span>
                    )}
                    {movie.rating > 0 && (
                        <>
                            <span className="text-slate-700">·</span>
                            <span className="text-[11px] text-yellow-500/80">★ {movie.rating.toFixed(1)}</span>
                        </>
                    )}
                </div>
            )}
        </Link>
    );
}

export default function RecommendationRow({
    type,
    sourceMovieId,
    limit = 12,
}: RecommendationRowProps) {
    const { isLoggedIn } = useAuth();
    const t = useTranslations('Recommendations');
    const [recs, setRecs] = useState<MovieRecommendation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                let data: MovieRecommendation[] = [];
                if (type === 'for-you') {
                    data = await recommendationService.getForYou(limit);
                } else if (type === 'trending-for-you') {
                    data = await recommendationService.getTrendingForYou(limit);
                } else if (type === 'because-you-watched' && sourceMovieId) {
                    data = await recommendationService.getBecauseYouWatched(sourceMovieId, limit);
                }
                if (!cancelled) setRecs(data);
            } catch {
                // silently fail — component returns null when recs.length === 0
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void load();
        return () => { cancelled = true; };
    }, [isLoggedIn, type, sourceMovieId, limit]);

    // Not logged in — show nothing
    if (!isLoggedIn) return null;

    const title =
        type === 'for-you' ? t('forYou')
        : type === 'trending-for-you' ? t('trendingForYou')
        : recs[0]?.reason ?? t('becauseYouWatched', { title: '' });

    // No results and not loading — show nothing
    if (!loading && recs.length === 0) return null;

    return (
        <section className="pl-6 lg:pl-24 max-w-[1440px] mx-auto overflow-hidden">
            <div className="flex items-center justify-between pr-6 lg:pr-24 mb-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-white text-2xl font-bold tracking-tight">{title}</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                        {t('poweredByAI')}
                    </span>
                </div>
            </div>

            <div
                aria-live="polite"
                aria-busy={loading}
                className="flex gap-4 overflow-x-auto hide-scrollbar pb-6"
            >
                {loading
                    ? Array.from({length: limit ?? 6  }).map((_, i) => <SkeletonCard key={i} />)
                    : recs.map((rec) => <RecCard key={rec.movie.id} rec={rec} />)}
            </div>
        </section>
    );
}
