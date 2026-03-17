'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { movieService } from '@/services/movie.service';
import { searchService, SearchResult } from '@/services/search.service';
import { useRouter, usePathname } from '@/i18n/routing';
import SearchSidebar from '@/components/search/SearchSidebar';
import SearchToolbar from '@/components/search/SearchToolbar';
import SearchPagination from '@/components/search/SearchPagination';
import SearchResultGrid from '@/components/search/SearchResultGrid';
import Breadcrumb from '@/components/Breadcrumb';

export interface SearchFilters {
    q?: string;
    genres?: string[];
    yearFrom?: string;
    yearTo?: string;
    minRating?: string;
    sortBy?: string;
    type?: string;
}

interface DiscoveryTemplateProps {
    baseTitle: string;
    breadcrumbItems: { label: string; href?: string; active?: boolean }[];
    initialFilters?: SearchFilters;
    hideSearchInTitle?: boolean;
}

function DiscoveryContent({ 
    baseTitle, 
    breadcrumbItems, 
    initialFilters = {},
    hideSearchInTitle = false
}: DiscoveryTemplateProps) {
    const t = useTranslations('Search');
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    // Read from URL params
    const q = searchParams.get('q') || initialFilters.q || '';
    const genres = useMemo(() => searchParams.get('genres')?.split(',') || initialFilters.genres || [], [searchParams, initialFilters.genres]);
    const yearFrom = searchParams.get('yearFrom') || initialFilters.yearFrom || '1990';
    const yearTo = searchParams.get('yearTo') || initialFilters.yearTo || '2024';
    const minRating = searchParams.get('minRating') || initialFilters.minRating || '0';
    const sortBy = searchParams.get('sortBy') || initialFilters.sortBy || 'relevance';
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
    const [activeTab, setActiveTab] = useState(initialFilters.type || 'all'); 
    const [isStudiosOpen, setIsStudiosOpen] = useState(false);
    const [importingId, setImportingId] = useState<number | null>(null);

    // Fetch genres once
    useEffect(() => {
        movieService.getGenres().then(setGenresList).catch(console.error);
    }, []);

    // Perform search
    useEffect(() => {
        const fetchSearch = async () => {
            setIsLoading(true);
            try {
                // Map slugs to names for the API search (ES uses names)
                const genreNames = genres.map(g => {
                    const found = genresList.find(x => x.slug === g);
                    return found ? found.name : g;
                });

                const response = await searchService.search({
                    q, 
                    genre: genreNames.join(','),
                    type: activeTab !== 'all' ? activeTab : undefined,
                    yearFrom: yearFrom ? parseInt(yearFrom) : undefined,
                    yearTo: yearTo ? parseInt(yearTo) : undefined,
                    minRating: minRating ? parseFloat(minRating) : undefined,
                    sortBy,
                    page,
                    limit: 12
                });
                setResults(response.results || []);
                setTotal(response.total || 0);
            } catch (error) {
                console.error('Failed to load discovery results', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSearch();
        setFilterMinRating(minRating);
    }, [q, genres, yearFrom, yearTo, minRating, sortBy, page, genresList, activeTab]);

    const handleApplyFilters = (overrideParams: Record<string, unknown> = {}) => {
        const params = new URLSearchParams();
        
        const finalQ = (overrideParams.q !== undefined ? overrideParams.q : filterQuery) as string;
        if (finalQ) params.set('q', finalQ);
        
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`${pathname}?${params.toString()}` as any);
    };

    const handleClearFilters = () => {
        setFilterQuery('');
        setFilterGenres(initialFilters.genres || []);
        setFilterYearFrom('1990');
        setFilterYearTo('2024');
        setFilterMinRating('0');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(pathname as any);
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
            console.error('Failed to import movie', error);
            alert(t('importError'));
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

                <main className="flex-1 overflow-y-auto custom-scrollbar bg-background-dark/50 pt-20">
                    <div className="max-w-[1600px] mx-auto p-8 sm:p-12">
                        <div className="mb-10 lg:flex items-center justify-between gap-6">
                            <div className="space-y-4 mb-6 lg:mb-0">
                                <Breadcrumb items={breadcrumbItems} />
                                <h1 className="text-3xl sm:text-4xl font-black text-white capitalize">
                                    {!hideSearchInTitle && q ? t('resultsFor', { query: q }) : baseTitle}
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
                                        {t('minYear', { year: yearFrom })}
                                        <button onClick={() => {setFilterYearFrom('1990'); handleApplyFilters({yearFrom: '1990'});}} className="hover:text-primary"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                    </div>
                                )}
                                {minRating !== '0' && (
                                    <div className="bg-white/5 border border-white/10 pl-3 pr-2 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                        {t('ratingPlus', { rating: minRating })}
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
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function DiscoveryTemplate(props: DiscoveryTemplateProps) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center pt-20 bg-background-dark">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <DiscoveryContent {...props} />
        </Suspense>
    );
}
