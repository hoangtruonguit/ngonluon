'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { movieService, Movie } from '@/services/movie.service';
import MovieCard from '@/components/MovieCard';
import { useRouter } from '@/i18n/routing';

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    // Read from URL params
    const q = searchParams.get('q') || '';
    const genre = searchParams.get('genre') || '';
    const year = searchParams.get('year') || '';
    const rating = searchParams.get('rating') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';

    const [movies, setMovies] = useState<Movie[]>([]);
    const [genresList, setGenresList] = useState<{name: string, slug: string}[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [filterQuery, setFilterQuery] = useState(q);
    const [filterGenre, setFilterGenre] = useState(genre);
    const [filterYear, setFilterYear] = useState(year);
    const [filterRating, setFilterRating] = useState(rating);
    const [filterSort, setFilterSort] = useState(sortBy);

    // Fetch genres once
    useEffect(() => {
        movieService.getGenres().then(setGenresList).catch(console.error);
    }, []);

    // Perform search
    useEffect(() => {
        const fetchSearch = async () => {
            setIsLoading(true);
            try {
                const results = await movieService.searchMovies({
                    q, genre, year, rating, sortBy, limit: 20
                });
                setMovies(results.data || []);
            } catch (error) {
                console.error('Failed to load search results', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSearch();

        // sync local state with params if they change externally
        setFilterQuery(q);
        setFilterGenre(genre);
        setFilterYear(year);
        setFilterRating(rating);
        setFilterSort(sortBy);
    }, [q, genre, year, rating, sortBy]);

    const handleApplyFilters = () => {
        const params = new URLSearchParams();
        if (filterQuery) params.set('q', filterQuery);
        if (filterGenre) params.set('genre', filterGenre);
        if (filterYear) params.set('year', filterYear);
        if (filterRating) params.set('rating', filterRating);
        if (filterSort) params.set('sortBy', filterSort);

        router.push(`/search?${params.toString()}`);
    };

    const handleClearFilters = () => {
        setFilterQuery('');
        setFilterGenre('');
        setFilterYear('');
        setFilterRating('');
        setFilterSort('newest');
        router.push(`/search`);
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 30}, (_, i) => currentYear - i);

    return (
        <div className="max-w-[1440px] mx-auto px-6 lg:px-24 py-32 flex flex-col md:flex-row gap-8">
            {/* Sidebar / Filters */}
            <aside className="w-full md:w-64 shrink-0 bg-surface-dark/50 border border-white/5 rounded-2xl p-6 h-fit space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">filter_alt</span>
                        Filters
                    </h2>
                    
                    <div className="space-y-4">
                        {/* Keyword */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Keyword</label>
                            <input 
                                type="text"
                                value={filterQuery}
                                onChange={(e) => setFilterQuery(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Search..."
                            />
                        </div>

                        {/* Genre */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Genre</label>
                            <select 
                                value={filterGenre}
                                onChange={(e) => setFilterGenre(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none"
                            >
                                <option value="">All Genres</option>
                                {genresList.map(g => (
                                    <option key={g.slug} value={g.slug}>{g.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Year */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Release Year</label>
                            <select 
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none"
                            >
                                <option value="">Any Year</option>
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Rating */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Min Rating</label>
                            <select 
                                value={filterRating}
                                onChange={(e) => setFilterRating(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none"
                            >
                                <option value="">Any Rating</option>
                                <option value="9">9+ Stars</option>
                                <option value="8">8+ Stars</option>
                                <option value="7">7+ Stars</option>
                                <option value="6">6+ Stars</option>
                            </select>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sort By</label>
                            <select 
                                value={filterSort}
                                onChange={(e) => setFilterSort(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none"
                            >
                                <option value="newest">Newest First</option>
                                <option value="rating">Top Rated</option>
                                <option value="popularity">Popularity</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <button 
                            onClick={handleApplyFilters}
                            className="w-full bg-primary hover:bg-primary/80 text-secondary font-bold py-2.5 rounded-lg transition-colors"
                        >
                            Apply Filters
                        </button>
                        <button 
                            onClick={handleClearFilters}
                            className="w-full bg-transparent hover:bg-white/5 border border-white/10 text-white font-semibold py-2.5 rounded-lg transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </aside>

            {/* Results Grid */}
            <main className="flex-1">
                <div className="mb-8 border-b border-white/10 pb-4">
                    <h1 className="text-3xl font-extrabold text-white">
                        Search Results
                    </h1>
                    {q && (
                        <p className="text-gray-400 mt-2">
                            Showing results for <span className="text-white font-semibold">"{q}"</span>
                        </p>
                    )}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <div key={n} className="aspect-[2/3] bg-surface-dark border border-white/5 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : movies.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {movies.map((movie) => (
                            <MovieCard 
                                key={movie.id}
                                title={movie.title}
                                rating={movie.rating.toString()}
                                description={movie.description || ''}
                                imageUrl={movie.posterUrl || movie.thumbnailUrl || ''}
                                slug={movie.slug}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="size-24 bg-surface-dark rounded-full flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl text-gray-500">search_off</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No movies found</h3>
                        <p className="text-gray-400 max-w-md">
                            We couldn't find any movies matching your current filters. Try adjusting your search query or selecting less restrictive filters.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <SearchResultsContent />
        </Suspense>
    );
}
