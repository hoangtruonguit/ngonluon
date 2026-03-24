'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const navItems = [
    { href: '/admin' as const, icon: 'dashboard', labelKey: 'dashboard' },
    { href: '/admin/analytics' as const, icon: 'analytics', labelKey: 'analytics' },
    { href: '/admin/movies' as const, icon: 'movie', labelKey: 'movies' },
    { href: '/admin/users' as const, icon: 'group', labelKey: 'users' },
    { href: '/admin/crawl' as const, icon: 'cloud_download', labelKey: 'crawl' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoggedIn, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Admin');

    const isAdmin = user?.roles?.includes('ADMIN');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && (!isLoggedIn || !isAdmin)) {
            router.push('/');
        }
    }, [isLoading, isLoggedIn, isAdmin, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="text-white/50 flex items-center gap-3">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    {t('loading')}
                </div>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-background-dark flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`w-64 bg-surface-dark border-r border-white/10 flex flex-col fixed h-full z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-primary">
                        <span className="material-symbols-outlined text-3xl">movie_filter</span>
                        <span className="text-white text-xl font-extrabold">Admin</span>
                    </Link>
                    <button className="md:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                {t(item.labelKey)}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-white/10">
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/40 hover:text-white hover:bg-white/5 transition-all">
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                        {t('backToSite')}
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64">
                {/* Mobile top bar */}
                <div className="md:hidden flex items-center gap-3 p-4 border-b border-white/10 bg-surface-dark sticky top-0 z-30">
                    <button onClick={() => setSidebarOpen(true)} className="text-white p-1">
                        <span className="material-symbols-outlined text-2xl">menu</span>
                    </button>
                    <span className="text-white font-bold">Admin</span>
                </div>
                <div className="p-4 sm:p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
