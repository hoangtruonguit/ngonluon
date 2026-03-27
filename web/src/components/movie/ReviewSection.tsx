'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/i18n/routing';
import { movieService, MovieReview, AudienceRating } from '@/services/movie.service';
import { resolveAvatarUrl } from '@/lib/api';
import Image from 'next/image';

interface ReviewSectionProps {
    movieId: string;
    initialReviews?: MovieReview[];
    initialAudienceRating?: AudienceRating;
    className?: string;
}

function StarDisplay({ rating, size = 'text-base' }: { rating: number; size?: string }) {
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
        <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHovered(star)}
                    onClick={() => onChange(star)}
                    className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`${star} star`}
                >
                    <span
                        className={`material-symbols-outlined text-3xl transition-colors ${active >= star ? 'text-yellow-400' : 'text-gray-600'}`}
                        style={active >= star ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                        star
                    </span>
                </button>
            ))}
        </div>
    );
}

function RatingDistribution({ distribution, total }: { distribution: AudienceRating['distribution']; total: number }) {
    return (
        <div className="space-y-1.5 w-full">
            {distribution.map((d, idx) => {
                const starLabel = 5 - idx;
                return (
                    <div key={starLabel} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400 w-3 shrink-0">{starLabel}</span>
                        <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                style={{ width: total > 0 ? `${d.percentage}%` : '0%' }}
                            />
                        </div>
                        <span className="text-gray-500 w-7 text-right shrink-0">{d.count}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default function ReviewSection({
    movieId,
    initialReviews = [],
    initialAudienceRating,
    className = 'mt-12',
}: ReviewSectionProps) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const t = useTranslations('Watch');

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ratingError, setRatingError] = useState(false);

    const { data: reviews = initialReviews, mutate } = useSWR<MovieReview[]>(
        movieId ? `reviews-${movieId}` : null,
        () => movieService.getReviewsByMovie(movieId, 0, 50),
        { fallbackData: initialReviews },
    );

    // Compute audience rating from live reviews data
    const totalReviews = reviews.length;
    const ratingSum = reviews.reduce((s, r) => s + r.rating, 0);
    const averageRating = totalReviews > 0 ? Math.round((ratingSum / totalReviews) * 10) / 10 : 0;

    const ratingCounts = [0, 0, 0, 0, 0];
    for (const r of reviews) {
        const idx = Math.max(1, Math.min(5, r.rating)) - 1;
        ratingCounts[idx]++;
    }
    const distribution = ratingCounts
        .map((count) => ({ count, percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0 }))
        .reverse(); // 5-star first

    const audienceRating: AudienceRating = initialAudienceRating
        ? { average: averageRating || initialAudienceRating.average, totalReviews, distribution }
        : { average: averageRating, totalReviews, distribution };

    const handleSubmit = async () => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }
        if (rating === 0) {
            setRatingError(true);
            return;
        }
        setRatingError(false);
        setIsSubmitting(true);
        const newReview = await movieService.addReview(movieId, rating, comment.trim() || undefined);
        if (newReview) {
            setRating(0);
            setComment('');
            mutate((prev = []) => {
                const filtered = prev.filter((r) => r.user.id !== newReview.user.id);
                return [newReview, ...filtered];
            }, { revalidate: false });
        }
        setIsSubmitting(false);
    };

    const handleRatingChange = (v: number) => {
        setRating(v);
        if (v > 0) setRatingError(false);
    };

    return (
        <div className={`bg-surface-dark/30 rounded-xl p-6 border border-white/5 ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary">star</span>
                <h3 className="text-xl font-bold text-white">{t('reviewSectionTitle')}</h3>
                <span className="text-gray-500 font-normal text-base">
                    ({t('reviewsCount', { count: totalReviews })})
                </span>
            </div>

            {/* Audience Rating Stats */}
            {totalReviews > 0 && (
                <div className="flex flex-col sm:flex-row items-center gap-8 mb-10 p-5 bg-white/3 rounded-xl border border-white/5">
                    <div className="text-center shrink-0">
                        <p className="text-6xl font-bold text-white leading-none">{audienceRating.average.toFixed(1)}</p>
                        <StarDisplay rating={audienceRating.average} size="text-lg" />
                        <p className="text-xs text-gray-500 mt-1">{t('ratingsCount', { count: totalReviews })}</p>
                    </div>
                    <div className="flex-1 w-full">
                        <RatingDistribution distribution={audienceRating.distribution} total={totalReviews} />
                    </div>
                </div>
            )}

            {/* Write Review Form */}
            <div className="mb-10">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t('yourRating')}</p>
                <div className="flex gap-4">
                    <div className="size-10 rounded-full bg-gray-700 shrink-0 overflow-hidden relative">
                        <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-gray-400">person</span>
                    </div>
                    <div className="flex-1 space-y-4">
                        {/* Star Input */}
                        <div>
                            <StarInput value={rating} onChange={handleRatingChange} />
                            {ratingError && (
                                <p className="text-xs text-red-400 mt-1">{t('ratingRequired')}</p>
                            )}
                        </div>
                        {/* Comment textarea */}
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-surface-dark border border-white/10 rounded-xl p-4 text-sm focus:ring-1 focus:ring-primary focus:outline-none min-h-[90px] text-white placeholder:text-gray-500"
                            placeholder={isLoggedIn ? t('reviewPlaceholder') : t('loginToCommentPlaceholder')}
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-2 bg-primary text-secondary font-bold rounded-lg hover:scale-105 transition-transform w-full sm:w-auto disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isLoggedIn
                                    ? isSubmitting ? t('reviewPosting') : t('reviewSubmit')
                                    : t('loginToReview')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.length > 0 ? (
                    reviews.map((r) => (
                        <div key={r.id} className="flex gap-4">
                            <div className="size-10 rounded-full bg-gray-700 shrink-0 overflow-hidden relative">
                                {r.user.avatarUrl ? (
                                    <Image
                                        src={resolveAvatarUrl(r.user.avatarUrl)!}
                                        alt={r.user.fullName || 'User'}
                                        fill
                                        sizes="40px"
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-gray-400">person</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                                    <span className="text-white font-bold text-sm">{r.user.fullName || 'User'}</span>
                                    <StarDisplay rating={r.rating} size="text-sm" />
                                    <span className="text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                                </div>
                                {r.comment && (
                                    <p className="text-sm text-gray-300">{r.comment}</p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center text-sm">{t('reviewEmpty')}</p>
                )}
            </div>
        </div>
    );
}
