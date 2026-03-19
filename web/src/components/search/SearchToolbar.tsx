'use client';
import { useTranslations } from 'next-intl';

interface SearchToolbarProps {
    total: number;
    resultsCount: number;
    page: number;
    sortBy: string;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    onSortChange: (sortBy: string) => void;
}

export default function SearchToolbar({
    total,
    resultsCount,
    page,
    sortBy,
    viewMode,
    onViewModeChange,
    onSortChange
}: SearchToolbarProps) {
    const t = useTranslations('Search');
    const start = total === 0 ? 0 : (page - 1) * 10 + 1;
    const end = Math.min(page * 10, total);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 pb-6 border-b border-white/5">
            <div className="text-white/40 text-sm font-medium">
                {total > 0 || resultsCount > 0 ? (
                    t.rich('showingResults', {
                        range: (chunks) => <span className="text-white">{start}-{end}</span>,
                        total: (chunks) => <span className="text-white">{total || resultsCount}</span>
                    })
                ) : (
                    t('readyToSearch')
                )}
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative group w-full sm:w-48 text-[12px]">
                    <select 
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="w-full bg-[#0a0506] border border-white/5 rounded-xl px-4 py-2.5 text-white/60 focus:outline-none focus:border-primary/40 appearance-none font-bold tracking-wide"
                    >
                        <option value="relevance">{t('sortByLabel')} {t('relevance')}</option>
                        <option value="newest">{t('sortByLabel')} {t('newest')}</option>
                        <option value="rating">{t('sortByLabel')} {t('rating')}</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none text-base">expand_more</span>
                </div>

                <div className="flex bg-[#0a0506] border border-white/5 rounded-xl p-0.5">
                    <button 
                        onClick={() => onViewModeChange('grid')}
                        className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'grid' ? 'text-primary bg-white/5 shadow-inner' : 'text-white/20 hover:text-white/40'}`}
                    >
                        <span className="material-symbols-outlined text-base">grid_view</span>
                    </button>
                    <button 
                        onClick={() => onViewModeChange('list')}
                        className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'list' ? 'text-primary bg-white/5 shadow-inner' : 'text-white/20 hover:text-white/40'}`}
                    >
                        <span className="material-symbols-outlined text-base">view_list</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
