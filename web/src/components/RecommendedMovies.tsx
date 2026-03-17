// components/RecommendedMovies.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Movie, movieService } from '@/services/movie.service';
import Image from 'next/image';
import Link from 'next/link';

interface RecommendedMoviesProps {
    slug: string;
}

interface SimilarMovie {
    id: string;
    title: string;
    slug: string;
    posterUrl: string;
    releaseYear: number;
    genres: string[];
    rating: number;
}

export default function RecommendedMovies({ slug }: RecommendedMoviesProps) {
    const router = useRouter();
    const t = useTranslations('Watch');
    const [movies, setMovies] = useState<Movie[]>([]);

    useEffect(() => {
        const fetchSimilar = async () => {
            try {
                const data = await movieService.getSimilarMovies(slug);
                setMovies(data);
            } catch (error) {
                console.error('Failed to fetch similar movies:', error);
            }
        };
        fetchSimilar();
    }, [slug]);

    if (movies.length === 0) return null;

    return (

        <section>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold border-l-4 border-primary pl-4 uppercase tracking-wider">{t('recommendedTitle')}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {movies.map((similar) => (
                    <Link key={similar.id} href={`/movies/${similar.slug}`} className="group cursor-pointer">
                        <div className="aspect-[2/3] rounded-xl overflow-hidden relative mb-3 bg-surface-dark">
                            <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-110">
                                <Image
                                    src={similar.posterUrl || similar.thumbnailUrl}
                                    alt={similar.title}
                                    fill
                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                    className="object-cover"
                                />
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="material-symbols-outlined text-5xl text-white">play_circle</span>
                            </div>
                        </div>
                        <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{similar.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase mt-1">
                            {similar.releaseYear && <span>{similar.releaseYear}</span>}
                            {similar.genres.length > 0 && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-slate-500" />
                                    <span>{similar.genres.slice(0, 2).join(', ')}</span>
                                </>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}