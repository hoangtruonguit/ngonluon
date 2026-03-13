import Image from 'next/image';
import Link from 'next/link';
import ContinueWatchingSection from '@/components/ContinueWatchingSection';
import MovieCard from '@/components/MovieCard';
import HeroCarousel from '@/components/HeroCarousel';
import { movieService } from '@/services/movie.service';

export default async function Home() {
    const [trendingMovies, nowPlayingMovies, newReleases, genres] = await Promise.all([
        movieService.getTrendingMovies(5), // Only need 5 for hero
        movieService.getNowPlayingMovies(20),
        movieService.getNewReleases(10),
        movieService.getGenres(),
    ]);

    // Use trending movies for the carousel
    const featuredMovies = trendingMovies;

    return (
        <>
            {/* Hero Carousel Section */}
            <HeroCarousel movies={featuredMovies} />

            <main className="relative z-20 space-y-16 pb-24 mt-12">
                {/* Categories */}
                <section className="px-6 lg:px-24 max-w-[1440px] mx-auto py-4">
                    <div className="bg-secondary/30 backdrop-blur-xl p-2 rounded-2xl inline-flex gap-2 overflow-x-auto hide-scrollbar max-w-full border border-white/5 shadow-2xl">
                        <button className="px-8 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 bg-primary text-secondary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
                            All
                        </button>
                        {genres.map((genre) => (
                            <button
                                key={genre.id}
                                className="px-8 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-95"
                            >
                                {genre.name}
                            </button>
                        ))}
                    </div>
                </section>

                <ContinueWatchingSection />

                {/* Now Playing Carousel */}
                <section className="pl-6 lg:pl-24 max-w-[1440px] mx-auto overflow-hidden">
                    <h2 className="text-white text-2xl font-bold tracking-tight mb-6">Now Playing</h2>
                    <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6">
                        {nowPlayingMovies.map((movie) => (
                            <MovieCard
                                key={movie.id}
                                title={movie.title}
                                rating={movie.rating.toString()}
                                description={movie.description}
                                imageUrl={movie.thumbnailUrl || movie.posterUrl}
                                showWatchButton={true}
                                slug={movie.slug}
                            />
                        ))}
                    </div>
                </section>

                {/* New Releases Carousel */}
                <section className="pl-6 lg:pl-24 max-w-[1440px] mx-auto overflow-hidden">
                    <h2 className="text-white text-2xl font-bold tracking-tight mb-6">New Releases</h2>
                    <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6">
                        {newReleases.map((movie) => (
                            <MovieCard
                                key={movie.id}
                                title={movie.title}
                                rating={movie.rating.toString()}
                                description={movie.description}
                                imageUrl={movie.thumbnailUrl || movie.posterUrl}
                                showWatchButton={false}
                                slug={movie.slug}
                            />
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}
