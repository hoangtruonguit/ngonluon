import { Link } from '@/i18n/routing';
import MovieCard from '@/components/movie/MovieCard';
import HeroCarousel from '@/components/movie/HeroCarousel';
import { movieService } from '@/services/movie.service';
import { getTranslations } from 'next-intl/server';

export default async function Home() {
    const [trendingMovies, nowPlayingMovies, newReleases, genres] = await Promise.all([
        movieService.getTrendingMovies(5), // Only need 5 for hero
        movieService.getNowPlayingMovies(5),
        movieService.getNewReleases(5),
        movieService.getGenres(),
    ]);

    const t = await getTranslations('Home');

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
                        <Link href="/search" className="px-8 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 bg-primary text-secondary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
                            {t('allCategory')}
                        </Link>
                        {genres.map((genre) => (
                            <Link
                                key={genre.id}
                                href={`/genre/${genre.slug || genre.id}`}
                                className="px-8 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-95"
                            >
                                {genre.name}
                            </Link>
                        ))}
                    </div>
                </section>


                {/* Now Playing Carousel */}
                <section className="pl-6 lg:pl-24 max-w-[1440px] mx-auto overflow-hidden">
                    <div className="flex items-end justify-between pr-6 lg:pr-24 mb-6">
                        <h2 className="text-white text-2xl font-bold tracking-tight">{t('nowPlaying')}</h2>
                        <Link 
                            href="/category/now-playing" 
                            className="text-primary text-sm font-bold flex items-center gap-1 hover:underline transition-all duration-300"
                        >
                            {t('viewAll')}
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </Link>
                    </div>
                    <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6">
                        {nowPlayingMovies.map((movie) => (
                            <MovieCard
                                key={movie.id}
                                id={movie.id}
                                title={movie.title}
                                rating={movie.rating.toString()}
                                description={movie.description}
                                imageUrl={movie.thumbnailUrl || movie.posterUrl}
                                showWatchButton={true}
                                slug={movie.slug}
                                isPremium={movie.isPremium}
                            />
                        ))}
                    </div>
                </section>

                {/* New Releases Carousel */}
                <section className="pl-6 lg:pl-24 max-w-[1440px] mx-auto overflow-hidden">
                    <div className="flex items-end justify-between pr-6 lg:pr-24 mb-6">
                        <h2 className="text-white text-2xl font-bold tracking-tight">{t('newReleases')}</h2>
                        <Link 
                            href="/category/new-releases" 
                            className="text-primary text-sm font-bold flex items-center gap-1 hover:underline transition-all duration-300"
                        >
                            {t('viewAll')}
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </Link>
                    </div>
                    <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6">
                        {newReleases.map((movie) => (
                            <MovieCard
                                key={movie.id}
                                id={movie.id}
                                title={movie.title}
                                rating={movie.rating.toString()}
                                description={movie.description}
                                imageUrl={movie.thumbnailUrl || movie.posterUrl}
                                showWatchButton={true}
                                slug={movie.slug}
                                isPremium={movie.isPremium}
                            />
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}
