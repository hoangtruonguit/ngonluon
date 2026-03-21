'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { adminService } from '@/services/admin.service';
import UserGrowthChart from '@/components/admin/charts/UserGrowthChart';
import WatchActivityChart from '@/components/admin/charts/WatchActivityChart';
import GenrePopularityChart from '@/components/admin/charts/GenrePopularityChart';
import TopContentTable from '@/components/admin/charts/TopContentTable';

type Period = '7d' | '30d' | '90d';

const PERIODS: { value: Period; label: string }[] = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
];

export default function AnalyticsPage() {
    const t = useTranslations('Admin');
    const [period, setPeriod] = useState<Period>('30d');

    const { data: userGrowth } = useSWR(
        `admin-user-growth-${period}`,
        () => adminService.getUserGrowth(period),
    );
    const { data: watchActivity } = useSWR(
        `admin-watch-activity-${period}`,
        () => adminService.getWatchActivity(period),
    );
    const { data: topWatched } = useSWR('admin-top-watched', () => adminService.getTopContent('watched', 10));
    const { data: topRated } = useSWR('admin-top-rated', () => adminService.getTopContent('rated', 10));
    const { data: topCommented } = useSWR('admin-top-commented', () => adminService.getTopContent('commented', 10));
    const { data: genrePopularity } = useSWR('admin-genre-popularity', () => adminService.getGenrePopularity());

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('analytics')}</h1>
                    <p className="text-white/50">{t('analyticsDesc')}</p>
                </div>
                <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                period === p.value
                                    ? 'bg-primary text-white'
                                    : 'text-white/50 hover:text-white'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* User Growth */}
            <div className="mb-6">
                <UserGrowthChart data={userGrowth ?? []} />
            </div>

            {/* Watch Activity + Genre Popularity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <WatchActivityChart data={watchActivity ?? []} />
                <GenrePopularityChart data={(genrePopularity ?? []).slice(0, 10)} />
            </div>

            {/* Top Content Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TopContentTable title={t('topWatched')} data={topWatched ?? []} valueLabel={t('views')} />
                <TopContentTable title={t('topRated')} data={topRated ?? []} valueLabel={t('ratingLabel')} />
                <TopContentTable title={t('mostCommented')} data={topCommented ?? []} valueLabel={t('totalComments')} />
            </div>
        </div>
    );
}
