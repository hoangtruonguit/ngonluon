import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { movieService } from '@/services/movie.service';
import CommentSection from '@/components/CommentSection';
import RecommendedMovies from '@/components/RecommendedMovies';
import type { Metadata } from 'next';

interface MovieDetailsPageProps {
    params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: MovieDetailsPageProps): Promise<Metadata> {
    const { slug } = await params;
    const movie = await movieService.getMovieBySlug(slug);

    if (!movie) {
        return { title: 'Movie Not Found' };
    }

    return {
        title: `${movie.title} - StreamFlow`,
        description: movie.description || `Watch ${movie.title} on StreamFlow`,
    };
}

function formatDuration(minutes: number | null): string {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
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

function ReviewStars({ rating }: { rating: number }) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <span
                key={i}
                className={`material-symbols-outlined text-yellow-500 text-sm`}
                style={i <= rating ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
                star
            </span>
        );
    }
    return <div className="flex scale-75 origin-right">{stars}</div>;
}

// Color palette for user avatars without images
const AVATAR_COLORS = [
    'from-indigo-500 to-purple-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-500',
    'from-cyan-500 to-blue-500',
    'from-violet-500 to-fuchsia-500',
];

export default async function MovieDetailsPage({ params }: MovieDetailsPageProps) {
    const { slug } = await params;

    const [movie, similarMovies] = await Promise.all([
        movieService.getMovieBySlug(slug),
        movieService.getSimilarMovies(slug, 5),
    ]);

    if (!movie) {
        notFound();
    }

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
                                    <span className="px-2 py-0.5 rounded bg-primary text-[10px] font-bold uppercase">Trending</span>
                                )}
                                {movie.isVip && (
                                    <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold uppercase text-white">VIP</span>
                                )}
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">{movie.title}</h1>

                            {/* Meta info */}
                            <div className="flex items-center gap-4 text-sm font-medium text-slate-300">
                                {movie.releaseYear && <span>{movie.releaseYear}</span>}
                                {movie.durationMinutes && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-slate-500" />
                                        <span>{formatDuration(movie.durationMinutes)}</span>
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
                                <div key={genre} className="px-4 py-1.5 rounded-full border border-white/20 text-sm bg-white/5 hover:bg-white/10 transition-colors cursor-default">
                                    {genre}
                                </div>
                            ))}
                        </div>

                        {/* Description */}
                        {movie.description && (
                            <p className="max-w-2xl text-lg text-slate-300 leading-relaxed">
                                {movie.description}
                            </p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4 pt-4">
                            {movie.slug ? (
                                <Link href={`/watch/${movie.slug}`}>
                                    <button className="bg-primary text-secondary px-10 py-4 rounded-xl font-bold flex items-center gap-3 hover:scale-105 transition-transform duration-300">
                                        <span className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-secondary border-b-[8px] border-b-transparent ml-1" />
                                        Watch Now
                                    </button>
                                </Link>
                            ) : (
                                <button className="bg-primary text-secondary px-10 py-4 rounded-xl font-bold flex items-center gap-3 hover:scale-105 transition-transform duration-300">
                                    <span className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-secondary border-b-[8px] border-b-transparent ml-1" />
                                    Watch Now
                                </button>
                            )}
                            <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 backdrop-blur-md transition-all">
                                <span className="material-symbols-outlined">add</span>
                                My List
                            </button>
                            <button className="size-12 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                                <span className="material-symbols-outlined">share</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="max-w-[1440px] mx-auto px-6 py-16 space-y-20">
                {/* Top Cast Section */}
                {actors.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold border-l-4 border-primary pl-4 uppercase tracking-wider">Top Cast</h2>
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

                {/* Reviews and Stats */}
                <section className="grid lg:grid-cols-3 gap-12">
                    {/* Audience Rating */}
                    <div className="lg:col-span-1 space-y-8">
                        <h3 className="text-2xl font-bold uppercase tracking-wider mb-6">Audience Rating</h3>
                        <div className="bg-surface-dark p-8 rounded-2xl border border-white/5 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl font-bold text-white">
                                    {movie.audienceRating.totalReviews > 0
                                        ? movie.audienceRating.average
                                        : '—'}
                                </div>
                                <div>
                                    <StarRating rating={movie.audienceRating.average} />
                                    <p className="text-xs text-slate-400 font-medium uppercase mt-1">
                                        {movie.audienceRating.totalReviews.toLocaleString()} Ratings
                                    </p>
                                </div>
                            </div>

                            {/* Rating Distribution Bars */}
                            <div className="space-y-3">
                                {movie.audienceRating.distribution.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <span className="text-xs font-bold w-4">{5 - index}</span>
                                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-slate-400 w-8 text-right">{item.percentage}%</span>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full py-3 rounded-lg border border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all text-sm">
                                Rate Movie
                            </button>
                        </div>
                    </div>

                    {/* User Reviews */}
                    <div className="lg:col-span-2 h-full">
                        <CommentSection movieId={movie.id} className="h-full flex flex-col" />
                    </div>
                </section>

                {/* Recommended Movies */}
                {similarMovies.length > 0 && (
                    <RecommendedMovies slug={slug} />

                )}
            </div>
        </main>
    );
}
