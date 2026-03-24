'use client';

import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/contexts/AuthContext';
import { resolveAvatarUrl } from '@/lib/api';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';


import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function Header() {
    const { isLoggedIn, isLoading, user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Header');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = async () => {
        setIsMenuOpen(false);
        await logout();
    };

    // Close menu on click outside
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, router]);

    const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const isSearchPage = pathname === '/search' || pathname.startsWith('/search/');

    return (
        <header className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300 glass border-b border-white/10 py-4">
            <div className={`${isSearchPage ? 'w-full' : 'max-w-[1440px]'} mx-auto px-6 lg:px-24 flex items-center justify-between`}>
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center gap-2 text-primary">
                        <span className="material-symbols-outlined text-4xl font-bold">movie_filter</span>
                        <h2 className="text-white text-2xl font-extrabold tracking-tight">Trailer</h2>
                    </Link>
                    <nav className="hidden lg:flex items-center gap-8">
                        <Link className="text-white hover:text-primary transition-colors text-sm font-semibold" href="/category/movies">{t('movies')}</Link>
                        <Link className="text-white/70 hover:text-primary transition-colors text-sm font-semibold" href="/category/tv-shows">{t('tvShows')}</Link>
                        <Link className="text-white/70 hover:text-primary transition-colors text-sm font-semibold" href="/search">{t('categories')}</Link>
                        <Link className="text-white/70 hover:text-primary transition-colors text-sm font-semibold" href="/">{t('myList')}</Link>
                    </nav>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="relative hidden md:block">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-xl">search</span>
                        <input
                            className="bg-white/10 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary w-64 text-white placeholder:text-white/40"
                            placeholder={t('searchPlaceholder')}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchSubmit}
                        />
                    </div>
                    <button className="md:hidden text-white" onClick={() => router.push('/search')}>
                        <span className="material-symbols-outlined">search</span>
                    </button>
                    <div className="hidden sm:block">
                        <LanguageSwitcher />
                    </div>
                    {/* Hamburger menu button for mobile/tablet */}
                    <button
                        className="lg:hidden text-white p-1"
                        onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {isMobileNavOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                    <div className="flex items-center gap-3">
                        {isLoggedIn && (
                            <div className="relative" ref={menuRef}>
                                <div
                                    className="size-9 rounded-full overflow-hidden cursor-pointer transition-all active:scale-95 border-2 border-purple-500"
                                    title="Account menu"
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                >
                                        <Image
                                            src={resolveAvatarUrl(user?.avatarUrl) || "https://lh3.googleusercontent.com/aida-public/AB6AXuD1Lf8ou0dErc0m7he9KunMHpoZUwHkhj8ivVp9cRwQ4mirIRJgnx_vIeGEnUtTLkYCKvlmYkFdb2joykQ0oV7gR_3PFj34pGk9-K3KR0IWd52SclJqQ9EzVsau7YEmrMYfR6oFnDaoAegwzxIQ7cw49DPaNUPO3vWht8VRkGTkWgbMydPRlrPZIZcJY1DQxmFRuicd6Cxv-h_tnrMtsx_yTNXQuwh625X2vYyrvMahidyo0JG6YSCm5kBK7QkI8HS24eOXJgXYPEU"}
                                            alt="User profile avatar"
                                            fill
                                            sizes="36px"
                                            className="object-cover"
                                            unoptimized={!!user?.avatarUrl}
                                        />
                                    </div>

                                    {/* Dropdown Menu */}
                                    {isMenuOpen && (
                                        <div className="absolute right-0 mt-3 w-56 bg-background-dark/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden ring-1 ring-white/5">
                                            <div className="px-4 py-3 border-b border-white/5 mb-2">
                                                <p className="text-white font-bold text-sm truncate">{user?.fullName}</p>
                                                <p className="text-white/40 text-[10px] uppercase font-black tracking-widest truncate">{user?.email}</p>
                                            </div>
                                            {user?.roles?.includes('ADMIN') && (
                                                <Link
                                                    href="/admin"
                                                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-primary transition-all group"
                                                    onClick={() => setIsMenuOpen(false)}
                                                >
                                                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                                                    <span className="text-sm font-bold">{t('adminPanel')}</span>
                                                </Link>
                                            )}
                                            <Link
                                                href="/profile"
                                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/70 hover:text-primary transition-all group"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <span className="material-symbols-outlined text-lg">person</span>
                                                <span className="text-sm font-bold">{t('myProfile')}</span>
                                            </Link>
                                            <button 
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-white/70 hover:text-red-400 transition-all group"
                                                onClick={handleLogout}
                                            >
                                                <span className="material-symbols-outlined text-lg">logout</span>
                                                <span className="text-sm font-bold">{t('signOut')}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                        )}
                        {!isLoggedIn && !isLoading && (
                            <Link href="/login" className="bg-primary hover:bg-primary/80 text-secondary px-6 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95">
                                {t('signIn')}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMobileNavOpen && (
                <div className="lg:hidden border-t border-white/10 bg-background-dark/95 backdrop-blur-xl">
                    <nav className="flex flex-col px-6 py-4 gap-1">
                        <Link className="text-white hover:text-primary transition-colors text-sm font-semibold py-3 px-4 rounded-lg hover:bg-white/5" href="/category/movies" onClick={() => setIsMobileNavOpen(false)}>{t('movies')}</Link>
                        <Link className="text-white/70 hover:text-primary transition-colors text-sm font-semibold py-3 px-4 rounded-lg hover:bg-white/5" href="/category/tv-shows" onClick={() => setIsMobileNavOpen(false)}>{t('tvShows')}</Link>
                        <Link className="text-white/70 hover:text-primary transition-colors text-sm font-semibold py-3 px-4 rounded-lg hover:bg-white/5" href="/search" onClick={() => setIsMobileNavOpen(false)}>{t('categories')}</Link>
                        <Link className="text-white/70 hover:text-primary transition-colors text-sm font-semibold py-3 px-4 rounded-lg hover:bg-white/5" href="/" onClick={() => setIsMobileNavOpen(false)}>{t('myList')}</Link>
                    </nav>
                    <div className="sm:hidden px-6 pb-4">
                        <LanguageSwitcher />
                    </div>
                </div>
            )}
        </header>
    );
}
