'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { movieService } from '@/services/movie.service';
import { searchService, SearchResult } from '@/services/search.service';
import { useRouter } from '@/i18n/routing';
import SearchSidebar from '@/components/search/SearchSidebar';
import SearchToolbar from '@/components/search/SearchToolbar';
import SearchPagination from '@/components/search/SearchPagination';
import SearchResultGrid from '@/components/search/SearchResultGrid';

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    // Read from URL params
    const q = searchParams.get('q') || '';
    const genres = useMemo(() => searchParams.get('genres')?.split(',') || [], [searchParams]);
    const yearFrom = searchParams.get('yearFrom') || '1990';
    const yearTo = searchParams.get('yearTo') || '2024';
    const minRating = searchParams.get('minRating') || '0';
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1', 10);

    const [results, setResults] = useState<SearchResult[]>([]);
    const [total, setTotal] = useState(0);
    const [genresList, setGenresList] = useState<{name: string, slug: string}[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [filterQuery, setFilterQuery] = useState(q);
    const [filterGenres, setFilterGenres] = useState<string[]>(genres);
    const [filterYearFrom, setFilterYearFrom] = useState(yearFrom);
    const [filterYearTo, setFilterYearTo] = useState(yearTo);
    const [filterMinRating, setFilterMinRating] = useState(minRating);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'trending'
    const [isStudiosOpen, setIsStudiosOpen] = useState(false);
    const [importingId, setImportingId] = useState<number | null>(null);

    // Filter actors/directors from matchedCast in results
    const actorsAndDirectors = Array.from(new Set(results.flatMap(r => r.matchedCast || []).map(p => JSON.stringify(p)))).map(p => JSON.parse(p));

    // Fetch genres once
    useEffect(() => {
        movieService.getGenres().then(setGenresList).catch(console.error);
    }, []);

    // Perform search
    useEffect(() => {
        const fetchSearch = async () => {
            if (!q) {
                setResults([]);
                setTotal(0);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const response = await searchService.search({
                    q, 
                    genre: genres.join(','),
                    yearFrom: yearFrom ? parseInt(yearFrom) : undefined,
                    yearTo: yearTo ? parseInt(yearTo) : undefined,
                    minRating: minRating ? parseFloat(minRating) : undefined,
                    sortBy,
                    page,
                    limit: 10
                });
                setResults(response.results || []);
                setTotal(response.total || 0);
            } catch (error) {
                console.error('Failed to load search results', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSearch();

        // sync local state with params if they change externally
        setFilterMinRating(minRating);
    }, [q, genres, yearFrom, yearTo, minRating, sortBy, page]);

    const handleApplyFilters = (overrideParams: Record<string, unknown> = {}) => {
        const params = new URLSearchParams();
        if (filterQuery) params.set('q', filterQuery);
        
        const finalGenres = (overrideParams.genres !== undefined ? overrideParams.genres : filterGenres) as string[];
        if (finalGenres.length > 0) params.set('genres', finalGenres.join(','));
        
        const fYearFrom = (overrideParams.yearFrom !== undefined ? overrideParams.yearFrom : filterYearFrom) as string;
        if (fYearFrom && fYearFrom !== '1990') params.set('yearFrom', fYearFrom);
        
        const fYearTo = (overrideParams.yearTo !== undefined ? overrideParams.yearTo : filterYearTo) as string;
        if (fYearTo && fYearTo !== '2024') params.set('yearTo', fYearTo);
        
        const fMinRating = overrideParams.minRating !== undefined ? String(overrideParams.minRating) : filterMinRating;
        if (fMinRating && fMinRating !== '0') params.set('minRating', fMinRating);
        
        if (overrideParams.sortBy || sortBy !== 'relevance') params.set('sortBy', (overrideParams.sortBy as string) || sortBy);
        if (overrideParams.page || (page > 1 && !overrideParams.resetPage)) params.set('page', ((overrideParams.page as number) || page).toString());

        router.push(`/search?${params.toString()}`);
    };

    const handleClearFilters = () => {
        setFilterQuery('');
        setFilterGenres([]);
        setFilterYearFrom('1990');
        setFilterYearTo('2024');
        setFilterMinRating('0');
        router.push(`/search`);
    };

    const toggleGenre = (slug: string) => {
        setFilterGenres(prev => 
            prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
        );
    };

    const handleImport = async (tmdbId: number) => {
        setImportingId(tmdbId);
        try {
            const slug = await searchService.importMovie(tmdbId);
            router.push(`/movies/${slug}`);
        } catch (error) {
            alert('Failed to import movie. Please try again.');
        } finally {
            setImportingId(null);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background-dark text-white overflow-hidden font-sans">
            <div className="flex flex-1 overflow-hidden">
                <SearchSidebar 
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    filterGenres={filterGenres}
                    toggleGenre={toggleGenre}
                    genresList={genresList}
                    filterYearFrom={filterYearFrom}
                    filterYearTo={filterYearTo}
                    setFilterYearFrom={setFilterYearFrom}
                    setFilterYearTo={setFilterYearTo}
                    filterMinRating={filterMinRating}
                    setFilterMinRating={setFilterMinRating}
                    isStudiosOpen={isStudiosOpen}
                    setIsStudiosOpen={setIsStudiosOpen}
                    onClearFilters={handleClearFilters}
                    onApplyFilters={handleApplyFilters}
                />

                <main className="flex-1 overflow-y-auto custom-scrollbar bg-background-dark/50">
                    <div className="max-w-[1600px] mx-auto p-8 sm:p-12">
                        {/* Breadcrumbs & Filter Chips */}
                        <div className="mb-10 lg:flex items-center justify-between gap-6">
                            <div className="space-y-4 mb-6 lg:mb-0">
                                <div className="flex items-center gap-3 text-white/30 text-xs font-bold uppercase tracking-widest">
                                    <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => router.push('/')}>Home</span>
                                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                                    <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => router.push('/search')}>Search</span>
                                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                                    <span className="text-white">Results</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-black text-white">
                                    {q ? `Results for "${q}"` : 'Discover Content'}
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {genres.map(g => (
                                    <div key={g} className="bg-white/5 border border-white/10 pl-3 pr-2 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                        {genresList.find(x => x.slug === g)?.name || g}
                                        <button onClick={() => toggleGenre(g)} className="hover:text-primary"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                    </div>
                                ))}
                                {yearFrom !== '1990' && (
                                    <div className="bg-white/5 border border-white/10 pl-3 pr-2 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                        Min Year: {yearFrom}
                                        <button onClick={() => {setFilterYearFrom('1990'); handleApplyFilters({yearFrom: '1990'});}} className="hover:text-primary"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                    </div>
                                )}
                                {minRating !== '0' && (
                                    <div className="bg-white/5 border border-white/10 pl-3 pr-2 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                        Rating {minRating}+
                                        <button onClick={() => {setFilterMinRating('0'); handleApplyFilters({minRating: '0'});}} className="hover:text-primary"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <SearchToolbar 
                            total={total}
                            resultsCount={results.length}
                            page={page}
                            sortBy={sortBy}
                            onSortChange={(val) => handleApplyFilters({ sortBy: val, resetPage: true })}
                        />

                        <section className="mb-16">
                            <SearchResultGrid 
                                results={results}
                                isLoading={isLoading}
                                importingId={importingId}
                                onImport={handleImport}
                                onWatch={(slug) => router.push(`/movies/${slug}`)}
                                query={q}
                                onClearFilters={handleClearFilters}
                            />
                            
                            <SearchPagination 
                                page={page}
                                total={total}
                                onPageChange={(p) => handleApplyFilters({ page: p })}
                            />
                        </section>

                        {/* Actors & Directors Section */}
                        {actorsAndDirectors.length > 0 && (
                            <section className="pb-12">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-white text-2xl font-black flex items-center gap-3">
                                        Actors & Directors
                                        <div className="size-1.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-10">
                                    {actorsAndDirectors.slice(0, 12).map((person, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-4 group cursor-pointer w-24">
                                            <div className="relative size-24 sm:size-28 rounded-3xl overflow-hidden ring-1 ring-white/10 group-hover:ring-primary group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all duration-500 transform group-hover:rotate-3 group-hover:-translate-y-1">
                                                <div className="size-full rounded-3xl overflow-hidden bg-white/5 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-4xl text-white/10">person</span>
                                                </div>
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="size-6 rounded-full bg-primary mx-auto flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-white text-[14px]">info</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center space-y-1">
                                                <h4 className="text-white font-bold text-xs sm:text-sm line-clamp-1 group-hover:text-primary transition-colors">{person.name}</h4>
                                                <p className={`text-[10px] font-black uppercase tracking-tighter ${person.role === 'DIRECTOR' ? 'text-primary' : 'text-white/30'}`}>
                                                    {person.role === 'DIRECTOR' ? 'Director' : 'Actor'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </main>
            </div>
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
