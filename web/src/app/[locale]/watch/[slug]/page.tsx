'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { movieService, MovieDetail } from '@/services/movie.service';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import VideoPlayer from './components/VideoPlayer';
import MovieInfo from './components/MovieInfo';
import ActionButtons from '@/components/ActionButtons';
import CommentSection from '@/components/CommentSection';
import RecommendedMovies from '@/components/RecommendedMovies';
import Breadcrumb from '@/components/Breadcrumb';

interface WatchPageProps {
    params: Promise<{ slug: string; locale: string }>;
}

export default function WatchPage({ params }: WatchPageProps) {
    const { slug } = use(params);
    const router = useRouter();
    const [movie, setMovie] = useState<MovieDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMovie = async () => {
            const data = await movieService.getMovieBySlug(slug);
            setMovie(data);
            setIsLoading(false);
        };
        fetchMovie();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="h-screen w-full bg-background-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="h-screen w-full bg-background-dark flex flex-col items-center justify-center text-white space-y-4">
                <h1 className="text-4xl font-bold">Movie Not Found</h1>
                <button onClick={() => router.back()} className="bg-primary text-secondary px-6 py-2 rounded-full font-bold">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-gray-200 font-display relative z-0 pb-10">
            <Header />
            <div className="pt-24" />

            <main className="max-w-[1440px] mx-auto px-6 lg:px-24 py-6">
                <Breadcrumb movieTitle={movie.title} />

                <div className="flex flex-col gap-10">
                    <div className="w-full">
                        <VideoPlayer movie={movie} />
                        <ActionButtons />
                        <MovieInfo movie={movie} />
                        <CommentSection movieId={movie.id} />
                    </div>

                    <RecommendedMovies slug={slug} />
                </div>
            </main>

            <Footer />

            {/* Decorative Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-primary/3 blur-[120px] rounded-full" />
            </div>
        </div>
    );
}