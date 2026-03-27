import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { movieService } from '@/services/movie.service';
import { recommendationService, type MovieRecommendation } from '@/services/recommendation.service';
import CommentSection from '@/components/movie/CommentSection';
import MovieCard from '@/components/movie/MovieCard';
import MovieActionButtons from '@/components/movie/MovieActionButtons';
import type { Metadata } from 'next';
import {cache} from "react";

interface MovieDetailsPageProps {
    params: Promise<{ slug: string; locale: string }>;
}

const getMovie = cache((slug: string) => movieService.getMovieBySlug(slug));

export async function generateMetadata({ params }: MovieDetailsPageProps): Promise<Metadata> {
    const { slug, locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Watch' });
    const movie = await getMovie(slug);

    if (!movie) {
        return { title: t('movieNotFound') };
    }

    return {
        title: `${movie.title} - MovieStream`,
        description: movie.description || t('noDescription'),
    };
}

function formatDuration(minutes: number | null, tCommon: (key: string) => string): string {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hStr = h > 0 ? `${h}h ` : '';
    const mStr = `${m}${tCommon('minutesAbbr')}`;
    return hStr + mStr;
}

function StarRating({ rating, size = 'text-base' }: { rating: number; size?: string }) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars.push(
                <span key={i} className={`material-symbols-outlined text-yellow-500 ${size}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                </span>
            );
        } else if (i - 0.5 <= rating) {
            stars.push(
                <span key={i} className={`material-symbols-outlined text-yellow-500 ${size}`}>
                    star_half
                </span>
            );
        } else {
            stars.push(
                <span key={i} className={`material-symbols-outlined text-yellow-500/30 ${size}`}>
                    star
                </span>
            );
        }
    }
    return <div className="flex">{stars}</div>;
}


export default async function MovieDetailsPage({ params }: MovieDetailsPageProps) {
    const { slug, locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Watch' });
    const tCommon = await getTranslations({ locale, namespace: 'Common' });

    const movie = await getMovie(slug);

    if (!movie) {
        notFound();
    }

    // Fetch AI similar movies (public endpoint, uses movie UUID)
    const similarRecs = await recommendationService.getSimilar(movie.id, 10);

    const actors = movie.cast.filter((c) => c.role === 'ACTOR').slice(0, 6);

    return (
        <main className="relative">
            {/* Hero Section */}
            <div className="relative w-full h-[80vh] min-h-[600px] overflow-hidden">
                {/* Backdrop Image */}
                <div className="absolute inset-0">
                    <Image
                        src={movieService.getHighResImage(movie.thumbnailUrl || movie.posterUrl)}
                        alt={movie.title}
                        fill
                        sizes="100vw"
                        className="object-cover"
                        priority
                        quality={100}
                    />
                </div>
                <div className="absolute inset-0 hero-gradient" />

                {/* Hero Content */}
                <div className="absolute bottom-0 w-full max-w-[1440px] mx-auto left-1/2 -translate-x-1/2 px-6 pb-12 flex flex-col md:flex-row items-end gap-10">
                    {/* Movie Poster */}
                    {movie.posterUrl && (
                        <div className="hidden md:block w-72 shrink-0 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
                            <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-105">
                                <Image
                                    src={movieService.getHighResImage(movie.posterUrl)}
                                    alt={`${movie.title} poster`}
                                    fill
                                    sizes="288px"
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    )}

                    {/* Movie Details Hero */}
                    <div className="flex-1 space-y-6">
                        <div className="space-y-2">
                            {/* Badges */}
                            <div className="flex flex-wrap gap-2">
                                {movie.rating >= 8 && (
                                    <span className="px-2 py-0.5 rounded bg-primary text-[10px] font-bold uppercase">{t('trending')}</span>
                                )}
                                {movie.isPremium && (
                                    <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-[10px] font-bold uppercase text-yellow-400">Premium</span>
                                )}
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">{movie.title}</h1>

                            {/* Meta info */}
                            <div className="flex items-center gap-4 text-sm font-medium text-slate-300">
                                {movie.releaseYear && <span>{movie.releaseYear}</span>}
                                {movie.durationMinutes && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-slate-500" />
                                        <span>{formatDuration(movie.durationMinutes, tCommon)}</span>
                                    </>
                                )}
                                <span className="w-1 h-1 rounded-full bg-slate-500" />
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    <span className="text-white">{movie.rating}</span>
                                </div>
                            </div>
                        </div>

                        {/* Genre Tags */}
                        <div className="flex flex-wrap gap-2">
                            {movie.genres.map((genre) => (
                                <Link
                                    key={genre}
                                    href={`/genre/${genre}`}
                                    className="px-4 py-1.5 rounded-full border border-white/20 text-sm bg-white/5 hover:bg-white/10 transition-colors cursor-default">
                                    {genre}
                                </Link>
                            ))}
                        </div>

                        {/* Description */}
                        {movie.description && (
                            <p className="max-w-2xl text-lg text-slate-300 leading-relaxed">
                                {movie.description}
                            </p>
                        )}

                        {/* Action Buttons */}
                        <MovieActionButtons movieId={movie.id} movieSlug={movie.slug} />

                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="max-w-[1440px] mx-auto px-6 py-16 space-y-20">
                {/* Top Cast Section */}
                {actors.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold border-l-4 border-primary pl-4 uppercase tracking-wider">{t('topCast')}</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                            {actors.map((member) => (
                                <div key={member.personId} className="text-center group">
                                    <div className="size-32 mx-auto rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-300 mb-4 bg-surface-dark shadow-xl">
                                        {member.avatarUrl ? (
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={member.avatarUrl}
                                                    alt={member.name}
                                                    fill
                                                    sizes="128px"
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800 text-3xl font-bold text-white/70">
                                                {member.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-white group-hover:text-primary transition-colors">{member.name}</h4>
                                    {member.characterName && (
                                        <p className="text-xs text-slate-500 uppercase font-medium">{member.characterName}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Discussion & Rating */}
                <section>
                    <CommentSection
                        movieId={movie.id}
                        initialReviews={movie.reviews}
                        initialAudienceRating={movie.audienceRating}
                    />
                </section>

                {/* More Like This — AI-powered */}
                {similarRecs.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <h2 className="text-2xl font-bold border-l-4 border-primary pl-4 uppercase tracking-wider">{t('recommendedTitle')}</h2>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">AI</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {similarRecs.map((rec: MovieRecommendation) => (
                                <div key={rec.movie.id} className="relative">
                                    <MovieCard
                                        id={rec.movie.id}
                                        title={rec.movie.title}
                                        rating={rec.movie.rating.toString()}
                                        description=""
                                        imageUrl={rec.movie.posterUrl ?? ''}
                                        showWatchButton={true}
                                        slug={rec.movie.slug}
                                        isPremium={rec.movie.isPremium}
                                    />
                                    {rec.score > 0 && (
                                        <div className="absolute top-2 right-2 z-10">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                rec.score >= 0.8
                                                    ? 'text-green-400 border-green-400/30 bg-green-400/10'
                                                    : rec.score >= 0.6
                                                    ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
                                                    : 'text-slate-400 border-slate-400/30 bg-slate-400/10'
                                            }`}>
                                                {Math.round(rec.score * 100)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
