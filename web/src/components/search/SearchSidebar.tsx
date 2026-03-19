'use client';
import { useTranslations } from 'next-intl';

interface SearchSidebarProps {
    filterGenres: string[];
    toggleGenre: (slug: string) => void;
    genresList: { name: string; slug: string }[];
    filterYearFrom: string | undefined;
    filterYearTo: string | undefined;
    setFilterYearFrom: (val: string | undefined) => void;
    setFilterYearTo: (val: string | undefined) => void;
    filterMinRating: string;
    setFilterMinRating: (val: string) => void;
    isStudiosOpen: boolean;
    setIsStudiosOpen: (val: boolean) => void;
    onClearFilters: () => void;
    onApplyFilters: (override?: Record<string, unknown>) => void;
}

export default function SearchSidebar({
    filterGenres,
    toggleGenre,
    genresList,
    filterYearFrom,
    filterYearTo,
    setFilterYearFrom,
    setFilterYearTo,
    filterMinRating,
    setFilterMinRating,
    isStudiosOpen,
    setIsStudiosOpen,
    onClearFilters,
    onApplyFilters
}: SearchSidebarProps) {
    const t = useTranslations('Search');
    return (
        <aside className="w-80 border-r border-white/5 bg-[#0a0506]/80 backdrop-blur-xl flex flex-col overflow-y-auto custom-scrollbar shadow-2xl z-10">
            <div className="p-8 space-y-10">
                {/* Header Toggles */}


                <div>
                    <h3 className="text-white text-base font-bold mb-6 flex items-center justify-between">
                        {t('filters')}
                        {(filterGenres.length > 0 || filterYearFrom !== undefined || filterYearTo !== undefined || filterMinRating !== '0') && (
                            <button onClick={onClearFilters} className="text-primary text-xs font-medium hover:underline">{t('reset')}</button>
                        )}
                    </h3>

                    {/* Genre Section */}
                    <div className="mb-8">
                        <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-4">{t('genre')}</p>
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {genresList.map(g => (
                                <label key={g.slug} className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={filterGenres.includes(g.slug)}
                                            onChange={() => toggleGenre(g.slug)}
                                            className="peer sr-only"
                                        />
                                        <div className="size-5 rounded border-2 border-white/10 peer-checked:border-primary peer-checked:bg-primary transition-all flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-[14px] opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all font-bold">check</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-white/50 group-hover:text-white transition-colors">{g.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Year Range Section */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">{t('releaseYear')}</p>
                            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/60 font-mono tracking-tighter">
                                {filterYearFrom || 'Any'} — {filterYearTo || 'Any'}
                            </span>
                        </div>
                        <div className="space-y-4 px-1">
                            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 bg-primary left-0" style={{ width: '100%' }}></div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] text-white/30 uppercase mb-1 block">{t('from')}</label>
                                    <input
                                        type="number"
                                        value={filterYearFrom || ''}
                                        onChange={(e) => setFilterYearFrom(e.target.value || undefined)}
                                        className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                                        placeholder="Any"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-white/30 uppercase mb-1 block">{t('to')}</label>
                                    <input
                                        type="number"
                                        value={filterYearTo || ''}
                                        onChange={(e) => setFilterYearTo(e.target.value || undefined)}
                                        className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                                        placeholder="Any"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Rating Presets */}
                    <div className="mb-8">
                        <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-4">{t('userRating')}</p>
                        <div className="grid grid-cols-2 gap-2">
                            {['0', '7', '8', '9'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setFilterMinRating(r)}
                                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${filterMinRating === r ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5' : 'bg-white/5 border-transparent text-white/40 hover:text-white/60'}`}
                                >
                                    {r === '0' ? t('all') : `${r}.0 +`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Studios Collapsible */}
                    <div className="mb-10">
                        <button
                            onClick={() => setIsStudiosOpen(!isStudiosOpen)}
                            className="w-full flex items-center justify-between text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-4 hover:text-white transition-colors"
                        >
                            {t('studios')}
                            <span className={`material-symbols-outlined text-sm transition-transform ${isStudiosOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        {isStudiosOpen && (
                            <div className="space-y-3 pl-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                {['Marvel Studios', 'Pixar', 'Warner Bros', 'Universal'].map(s => (
                                    <label key={s} className="flex items-center gap-3 cursor-pointer group">
                                        <div className="size-4 rounded-full border border-white/10 flex items-center justify-center p-0.5">
                                            <div className="size-full rounded-full bg-transparent group-hover:bg-primary/20 transition-colors"></div>
                                        </div>
                                        <span className="text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">{s}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => onApplyFilters({ resetPage: true })}
                        className="w-full bg-primary py-4 rounded-xl font-bold text-sm text-white shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">tune</span>
                        {t('showResults')}
                    </button>
                </div>
            </div>
        </aside>
    );
}
