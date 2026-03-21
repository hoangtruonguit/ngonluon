'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminService } from '@/services/admin.service';

interface CrawlAction {
    key: string;
    icon: string;
    color: string;
    bg: string;
}

const crawlActions: CrawlAction[] = [
    { key: 'genres', icon: 'category', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { key: 'popular', icon: 'trending_up', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { key: 'trailers', icon: 'play_circle', color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

export default function CrawlPage() {
    const t = useTranslations('Admin');
    const [running, setRunning] = useState<string | null>(null);
    const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [popularPages, setPopularPages] = useState(1);

    const handleCrawl = async (action: string) => {
        setRunning(action);
        setResult(null);
        try {
            let res;
            switch (action) {
                case 'genres':
                    res = await adminService.crawlGenres();
                    break;
                case 'popular':
                    res = await adminService.crawlPopular(popularPages);
                    break;
                case 'trailers':
                    res = await adminService.crawlTrailers();
                    break;
            }
            setResult({ type: 'success', message: res?.data?.message || t('crawlSuccess') });
        } catch (err: unknown) {
            const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : t('crawlError');
            setResult({ type: 'error', message });
        } finally {
            setRunning(null);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('tmdbCrawl')}</h1>
            <p className="text-white/50 mb-8">{t('tmdbCrawlDesc')}</p>

            {result && (
                <div className={`px-4 py-3 rounded-xl mb-6 text-sm border ${
                    result.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                    {result.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {crawlActions.map((action) => (
                    <div key={action.key} className="bg-surface-dark border border-white/10 rounded-2xl p-6">
                        <div className={`${action.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                            <span className={`material-symbols-outlined text-2xl ${action.color}`}>{action.icon}</span>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">{t(`crawl_${action.key}`)}</h3>
                        <p className="text-white/50 text-sm mb-4">{t(`crawl_${action.key}_desc`)}</p>

                        {action.key === 'popular' && (
                            <div className="mb-4">
                                <label className="block text-white/50 text-xs font-semibold mb-1">{t('pages')}</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={popularPages}
                                    onChange={(e) => setPopularPages(Number(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        )}

                        <button
                            onClick={() => handleCrawl(action.key)}
                            disabled={running !== null}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {running === action.key ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                    {t('running')}
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">play_arrow</span>
                                    {t('run')}
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
