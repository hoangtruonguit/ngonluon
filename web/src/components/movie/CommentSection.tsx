'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from '@/i18n/routing';
import { movieService, MovieComment, MovieReview, AudienceRating } from '@/services/movie.service';
import { resolveAvatarUrl } from '@/lib/api';
import Image from 'next/image';

interface CommentSectionProps {
    movieId: string;
    initialReviews?: MovieReview[];
    initialAudienceRating?: AudienceRating;
    className?: string;
}

function StarDisplay({ rating, size = 'text-sm' }: { rating: number; size?: string }) {
    return (
        <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => {
                const filled = i <= Math.floor(rating);
                const half = !filled && i - 0.5 <= rating;
                return (
                    <span
                        key={i}
                        className={`material-symbols-outlined ${size} ${filled || half ? 'text-yellow-500' : 'text-yellow-500/25'}`}
                        style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                        {half ? 'star_half' : 'star'}
                    </span>
                );
            })}
        </div>
    );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hovered, setHovered] = useState(0);
    const active = hovered || value;

    return (
        <div className="flex gap-0.5" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHovered(star)}
                    onClick={() => onChange(value === star ? 0 : star)}
                    className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`${star} star`}
                >
                    <span
                        className={`material-symbols-outlined text-2xl transition-colors ${active >= star ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400/60'}`}
                        style={active >= star ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                        star
                    </span>
                </button>
            ))}
        </div>
    );
}

function AudienceStats({ reviews }: { reviews: MovieReview[] }) {
    const t = useTranslations('Watch');
    const total = reviews.length;
    if (total === 0) return null;

    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const avg = Math.round((sum / total) * 10) / 10;

    const counts = [0, 0, 0, 0, 0];
    for (const r of reviews) counts[Math.max(1, Math.min(5, r.rating)) - 1]++;
    const dist = [...counts].reverse(); // 5→1

    return (
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-4 bg-white/3 rounded-xl border border-white/5">
            <div className="text-center shrink-0">
                <p className="text-5xl font-bold text-white leading-none">{avg.toFixed(1)}</p>
                <StarDisplay rating={avg} size="text-base" />
                <p className="text-xs text-gray-500 mt-1">{t('ratingsCount', { count: total })}</p>
            </div>
            <div className="flex-1 w-full space-y-1.5">
                {dist.map((count, idx) => {
                    const star = 5 - idx;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400 w-3 shrink-0">{star}</span>
                            <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-gray-500 w-6 text-right shrink-0">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function CommentSection({
    movieId,
    initialReviews = [],
    initialAudienceRating,
    className = 'mt-12',
}: CommentSectionProps) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Watch');

    const [comment, setComment] = useState('');
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [rating, setRating] = useState(0);
    const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: comments = [], isLoading, mutate: mutateComments } = useSWR<MovieComment[]>(
        movieId ? (['comments', movieId] as [string, string]) : null,
        ([, id]: [string, string]) => movieService.getCommentsByMovie(id, 0, 50),
    );

    const { data: reviews = initialReviews, mutate: mutateReviews } = useSWR<MovieReview[]>(
        movieId ? (['reviews', movieId] as [string, string]) : null,
        ([, id]: [string, string]) => movieService.getReviewsByMovie(id, 0, 50),
        { fallbackData: initialReviews },
    );

    const canSubmit = comment.trim().length > 0 || rating > 0;

    const handlePost = async () => {
        if (!isLoggedIn) {
            router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}` as Parameters<typeof router.push>[0]);
            return;
        }
        if (!canSubmit) return;

        setIsSubmitting(true);

        await Promise.all([
            // Submit rating if selected
            rating > 0
                ? movieService.addReview(movieId, rating, comment.trim() || undefined).then((newReview) => {
                    if (newReview) {
                        mutateReviews((prev = []) => {
                            const filtered = (prev).filter((r) => r.user.id !== newReview.user.id);
                            return [newReview, ...filtered];
                        }, { revalidate: false });
                    }
                })
                : Promise.resolve(),
            // Submit comment if text provided
            comment.trim()
                ? movieService.addComment(movieId, comment, isSpoiler).then((newComment) => {
                    if (newComment) {
                        mutateComments((prev) => [newComment, ...(prev ?? [])], { revalidate: false });
                    }
                })
                : Promise.resolve(),
        ]);

        setComment('');
        setIsSpoiler(false);
        setRating(0);
        setIsSubmitting(false);
    };

    const sortedComments = sortBy === 'newest'
        ? [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : comments;

    // suppress unused warning for initialAudienceRating — it's used as SWR fallback via reviews
    void initialAudienceRating;

    return (
        <div className={`bg-surface-dark/30 rounded-xl p-6 border border-white/5 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">chat_bubble</span>
                    <h3 className="text-xl font-bold text-white">
                        {t('discussionTitle')}
                        <span className="text-gray-500 font-normal ml-2">({comments.length})</span>
                    </h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSortBy('newest')}
                        aria-pressed={sortBy === 'newest'}
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${sortBy === 'newest' ? 'bg-primary text-secondary' : 'bg-surface-dark text-gray-400 hover:bg-white/10'}`}
                    >
                        {t('sortByNewest')}
                    </button>
                    <button
                        onClick={() => setSortBy('top')}
                        aria-pressed={sortBy === 'top'}
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${sortBy === 'top' ? 'bg-primary text-secondary' : 'bg-surface-dark text-gray-400 hover:bg-white/10'}`}
                    >
                        {t('sortByTop')}
                    </button>
                </div>
            </div>

            {/* Audience Rating Stats */}
            <AudienceStats reviews={reviews} />

            {/* Unified form: rating + comment */}
            <div className="mb-10">
                <div className="flex gap-4">
                    <div className="size-10 rounded-full bg-gray-700 shrink-0 overflow-hidden relative">
                        <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-gray-400">person</span>
                    </div>
                    <div className="flex-1 space-y-3">
                        {/* Star rating row */}
                        <div className="flex items-center gap-3">
                            <StarInput value={rating} onChange={setRating} />
                            {rating > 0 && (
                                <span className="text-xs text-gray-400">{rating}/5</span>
                            )}
                        </div>

                        {/* Comment textarea */}
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-surface-dark border border-white/10 rounded-xl p-4 text-sm focus:ring-1 focus:ring-primary focus:outline-none min-h-[100px] text-white placeholder:text-gray-500"
                            placeholder={isLoggedIn ? t('commentPlaceholder') : t('loginToCommentPlaceholder')}
                        />

                        {/* Spoiler + submit */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isSpoiler}
                                    onChange={(e) => setIsSpoiler(e.target.checked)}
                                    className="sr-only"
                                />
                                <span aria-hidden="true" className={isSpoiler ? 'checked-style' : 'unchecked-style'}>
                                    <span className="text-xs text-gray-400">{t('spoilerTag')}</span>
                                </span>
                            </label>
                            <button
                                onClick={handlePost}
                                disabled={isSubmitting || (isLoggedIn && !canSubmit)}
                                className="px-8 py-2 bg-primary text-secondary font-bold rounded-lg hover:scale-105 transition-transform w-full sm:w-auto disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isLoggedIn
                                    ? isSubmitting ? t('commentPosting') : t('commentPost')
                                    : t('loginToPost')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments list */}
            <div aria-live="polite" aria-busy={isLoading} className="space-y-6">
                {isLoading ? (
                    <div className="flex justify-center">
                        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : sortedComments.length > 0 ? (
                    sortedComments.map((c) => (
                        <div key={c.id} className="flex gap-4">
                            <div className="size-10 rounded-full bg-gray-700 shrink-0 overflow-hidden relative">
                                {c.user.avatarUrl ? (
                                    <Image src={resolveAvatarUrl(c.user.avatarUrl)!} alt={c.user.fullName || 'User'} fill sizes="40px" className="object-cover" unoptimized />
                                ) : (
                                    <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-gray-400">person</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <span className="text-white font-bold text-sm mr-2">{c.user.fullName || 'User'}</span>
                                        <span className="text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {c.isSpoiler && (
                                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold uppercase rounded-full">
                                            {t('spoilerLabel')}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-sm ${c.isSpoiler ? 'text-gray-500 blur-sm hover:blur-none transition-all cursor-pointer' : 'text-gray-300'}`} title={c.isSpoiler ? t('revealSpoiler') : ''}>
                                    {c.content}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center text-sm">{t('commentEmpty')}</p>
                )}
            </div>
        </div>
    );
}
