'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import useSWR from 'swr';
import { adminService } from '@/services/admin.service';
import StatCard from '@/components/admin/StatCard';
import MiniChart from '@/components/admin/MiniChart';
import RecentActivityFeed from '@/components/admin/RecentActivityFeed';

export default function AdminDashboard() {
    const t = useTranslations('Admin');

    const { data: stats } = useSWR('admin-overview', () => adminService.getOverviewStats());
    const { data: userGrowth } = useSWR('admin-user-growth-7d', () => adminService.getUserGrowth('7d'));
    const { data: watchActivity } = useSWR('admin-watch-activity-7d', () => adminService.getWatchActivity('7d'));
    const { data: recentActivity, isLoading: activityLoading } = useSWR('admin-recent-activity', () => adminService.getRecentActivity(15));

    const statCards = [
        { icon: 'group', label: t('totalUsers'), value: stats?.totalUsers ?? 0, color: 'text-blue-400', bg: 'bg-blue-500/10', trend: stats ? { value: stats.newUsersLast7d, label: t('last7days') } : undefined },
        { icon: 'movie', label: t('totalMovies'), value: stats?.totalMovies ?? 0, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { icon: 'star', label: t('totalReviews'), value: stats?.totalReviews ?? 0, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        { icon: 'chat_bubble', label: t('totalComments'), value: stats?.totalComments ?? 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { icon: 'card_membership', label: t('activeSubscriptions'), value: stats?.activeSubscriptions ?? 0, color: 'text-pink-400', bg: 'bg-pink-500/10' },
        { icon: 'person_add', label: t('newUsers'), value: stats?.newUsersLast30d ?? 0, color: 'text-cyan-400', bg: 'bg-cyan-500/10', trend: stats ? { value: stats.newUsersLast7d, label: t('last7days') } : undefined },
    ];

    const quickLinks = [
        { icon: 'movie', title: t('movies'), description: t('moviesDesc'), href: '/admin/movies' as const, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { icon: 'cloud_download', title: t('crawl'), description: t('crawlDesc'), href: '/admin/crawl' as const, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { icon: 'analytics', title: t('analytics'), description: t('analyticsDesc'), href: '/admin/analytics' as const, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { icon: 'group', title: t('users'), description: t('usersDesc'), href: '/admin/users' as const, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('dashboard')}</h1>
            <p className="text-white/50 mb-8">{t('dashboardDesc')}</p>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {statCards.map((card) => (
                    <StatCard key={card.label} {...card} />
                ))}
            </div>

            {/* Mini Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                <MiniChart
                    title={t('userGrowth') + ` (${t('last7days')})`}
                    data={(userGrowth ?? []).map((p) => ({ date: p.date, value: p.count }))}
                    color="#60a5fa"
                    valueLabel={t('newUsers')}
                />
                <MiniChart
                    title={t('watchActivity') + ` (${t('last7days')})`}
                    data={(watchActivity ?? []).map((p) => ({ date: p.date, value: p.views }))}
                    color="#a78bfa"
                    valueLabel={t('views')}
                />
            </div>

            {/* Recent Activity */}
            <div className="mb-8">
                <RecentActivityFeed items={recentActivity ?? []} loading={activityLoading} />
            </div>

            {/* Quick Links */}
            <h2 className="text-lg font-semibold text-white mb-4">{t('quickLinks')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickLinks.map((card) => (
                    <Link
                        key={card.href}
                        href={card.href}
                        className="bg-surface-dark border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group"
                    >
                        <div className={`${card.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                            <span className={`material-symbols-outlined text-xl ${card.color}`}>{card.icon}</span>
                        </div>
                        <h3 className="text-white font-bold text-base mb-1 group-hover:text-primary transition-colors">{card.title}</h3>
                        <p className="text-white/50 text-sm">{card.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
