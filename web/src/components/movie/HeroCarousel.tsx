'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { movieService } from '@/services/movie.service';
import { useAuth } from '@/contexts/AuthContext';
import MovieActionButtons from '@/components/movie/MovieActionButtons';
import { useTranslations } from 'next-intl';

interface HeroMovie {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    posterUrl: string;
    slug?: string;
}

interface HeroCarouselProps {
    movies: HeroMovie[];
}

export default function HeroCarousel({ movies }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const { watchlistIds } = useAuth();
    
    const tHome = useTranslations('Home');
    const tCommon = useTranslations('Common');

    const nextSlide = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
    }, [movies.length]);

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + movies.length) % movies.length);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            nextSlide();
        }, 6000);

        return () => clearInterval(interval);
    }, [nextSlide, isPaused]);

    if (!movies || movies.length === 0) return null;

    return (
        <header
            className="relative h-[80vh] w-full overflow-hidden group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Slides */}
            {movies.map((movie, index) => (
                <div
                    key={movie.id}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${index === currentIndex
                        ? 'opacity-100 translate-x-0 z-10'
                        : 'opacity-0 translate-x-8 z-0'
                        }`}
                >
                    {/* Background Backdrop */}
                    <div className="absolute inset-0">
                        <Image
                            src={movieService.getHighResImage(movie.thumbnailUrl || movie.posterUrl) || "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070"}
                            alt={movie.title}
                            fill
                            sizes="100vw"
                            className="object-cover brightness-50"
                            priority={index === 0}
                            quality={100}
                        />
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/20 to-transparent z-10" />

                    {/* Content */}
                    <div className="relative z-20 h-full flex flex-col justify-center px-6 lg:px-24 max-w-[1440px] mx-auto space-y-6">
                        <div className={`space-y-2 transition-all duration-700 delay-300 transform ${index === currentIndex ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                            }`}>
                            <span className="text-primary font-bold tracking-widest uppercase text-sm">
                                {tHome('featuredMovie')}
                            </span>
                            <h1 className="text-white text-5xl lg:text-7xl font-black max-w-2xl leading-tight">
                                {movie.title}
                            </h1>
                        </div>

                        <p className={`text-white/70 text-lg max-w-xl leading-relaxed line-clamp-3 transition-all duration-700 delay-500 transform ${index === currentIndex ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                            }`}>
                            {movie.description}
                        </p>

                        <div className={`pt-4 transition-all duration-700 delay-700 transform ${index === currentIndex ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                            }`}>
                            {movie.id && (
                                <MovieActionButtons movieId={movie.id} movieSlug={movie.slug || ''} showDetails={true} />
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Thumbnail Navigation */}
            <div className="absolute bottom-8 right-6 lg:right-24 z-30 flex items-end gap-3 max-w-[80%] overflow-x-auto hide-scrollbar pb-2 pt-4 px-2">
                {movies.map((movie, index) => (
                    <button
                        key={movie.id}
                        onClick={() => goToSlide(index)}
                        className={`relative transition-all duration-500 rounded-xl overflow-hidden flex-shrink-0 group/thumb ${index === currentIndex
                            ? 'w-24 h-14 ring-2 ring-primary scale-105 z-10'
                            : 'w-20 h-12 opacity-60 hover:opacity-100 hover:scale-105'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    >
                        <Image
                            src={movieService.getHighResImage(movie.thumbnailUrl || movie.posterUrl)}
                            alt={movie.title}
                            fill
                            sizes="100px"
                            className="object-cover"
                        />
                        {/* Title overlay on hover/active */}
                        <div className={`absolute inset-0 bg-black/40 flex items-end p-1 transition-opacity duration-300 ${index === currentIndex ? 'opacity-100' : 'opacity-0 group-hover/thumb:opacity-100'
                            }`}>
                            <span className="text-[8px] text-white font-bold line-clamp-1">{movie.title}</span>
                        </div>
                    </button>
                ))}
            </div>
        </header>
    );
}
