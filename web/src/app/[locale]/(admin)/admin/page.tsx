'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function AdminDashboard() {
    const t = useTranslations('Admin');

    const cards = [
        {
            icon: 'movie',
            title: t('movies'),
            description: t('moviesDesc'),
            href: '/admin/movies' as const,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
        },
        {
            icon: 'cloud_download',
            title: t('crawl'),
            description: t('crawlDesc'),
            href: '/admin/crawl' as const,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
        },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('dashboard')}</h1>
            <p className="text-white/50 mb-8">{t('dashboardDesc')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <Link
                        key={card.href}
                        href={card.href}
                        className="bg-surface-dark border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group"
                    >
                        <div className={`${card.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                            <span className={`material-symbols-outlined text-2xl ${card.color}`}>{card.icon}</span>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-primary transition-colors">{card.title}</h3>
                        <p className="text-white/50 text-sm">{card.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
