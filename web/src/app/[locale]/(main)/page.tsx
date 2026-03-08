import Image from 'next/image';
import Link from 'next/link';
import ContinueWatchingSection from '@/components/ContinueWatchingSection';
import MovieCard from '@/components/MovieCard';
import { movieService } from '@/services/movie.service';

export default async function Home() {
    const [trendingMovies, newReleases, genres] = await Promise.all([
        movieService.getTrendingMovies(10),
        movieService.getNewReleases(10),
        movieService.getGenres(),
    ]);

    // Use the first trending movie as the hero
    const heroMovie = trendingMovies[0];

    return (
        <>
            {/* Hero Section */}
            <header className="relative h-[80vh] w-full overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src={heroMovie?.thumbnailUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAn8x5WfUuAn0M5XJ9qDq0E71X_G-Yy4m2f65u9R2S1yYqBwP_R8C0S6xH_D9Yy4x2f65u9R2S1yYqBwP_R8C0S6xH_D9Yy4x2f65u9R2S1yYqBwP_R8C0S6x"}
                        alt={heroMovie?.title || "Hero background"}
                        fill
                        sizes="100vw"
                        className="object-cover brightness-50"
                        priority
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/20 to-transparent z-10" />

                <div className="relative z-20 h-full flex flex-col justify-center px-6 lg:px-24 max-w-[1440px] mx-auto space-y-6">
                    <div className="space-y-2">
                        <span className="text-primary font-bold tracking-widest uppercase text-sm">
                            {heroMovie ? "Featured Movie" : "New Release"}
                        </span>
                        <h1 className="text-white text-5xl lg:text-7xl font-black max-w-2xl leading-tight">
                            {heroMovie?.title || "The Quantum Mystery"}
                        </h1>
                    </div>
                    <p className="text-white/70 text-lg max-w-xl leading-relaxed line-clamp-3">
                        {heroMovie?.description || "A young physicist discovers a way to travel between parallel universes, but every jump costs a part of her memory."}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4">
                        <button className="bg-primary text-secondary px-10 py-4 rounded-xl font-bold flex items-center gap-3 hover:scale-105 transition-transform duration-300">
                            <span className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-secondary border-b-[8px] border-b-transparent ml-1" />
                            Watch Now
                        </button>
                        <button className="bg-white/10 text-white backdrop-blur-md px-10 py-4 rounded-xl font-bold hover:bg-white/20 transition-all duration-300">
                            Details
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-20 -mt-20 space-y-12 pb-24">
                {/* Categories */}
                <section className="px-6 lg:px-24 max-w-[1440px] mx-auto py-8">
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar">
                        <button className="px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 bg-primary text-secondary">
                            All
                        </button>
                        {genres.map((genre) => (
                            <button
                                key={genre.id}
                                className="px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 bg-secondary/50 text-white/70 hover:bg-secondary hover:text-white"
                            >
                                {genre.name}
                            </button>
                        ))}
                    </div>
                </section>

                <ContinueWatchingSection />

                {/* Trending Now Carousel */}
                <section className="pl-6 lg:pl-24 max-w-[1440px] mx-auto overflow-hidden">
                    <h2 className="text-white text-2xl font-bold tracking-tight mb-6">Trending Now</h2>
                    <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6">
                        {trendingMovies.map((movie) => (
                            <MovieCard
                                key={movie.id}
                                title={movie.title}
                                rating={movie.rating.toString()}
                                description={movie.description}
                                imageUrl={movie.thumbnailUrl || movie.posterUrl}
                                showWatchButton={true}
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
                            />
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}
