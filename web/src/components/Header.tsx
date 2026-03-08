'use client';

import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
    const { isLoggedIn, isLoading, user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300 glass border-b border-white/10 px-6 py-4 lg:px-12">
            <div className="max-w-[1440px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center gap-2 text-primary">
                        <span className="material-symbols-outlined text-4xl font-bold">movie_filter</span>
                        <h2 className="text-white text-2xl font-extrabold tracking-tight">StreamFlow</h2>
                    </Link>
                    <nav className="hidden lg:flex items-center gap-8">
                        <Link className="text-white hover:text-primary transition-colors text-sm font-semibold" href="#">Movies</Link>
                        <Link className="text-white/70 hover:text-primary transition-colors text-sm font-semibold" href="#">TV Shows</Link>
                        <Link className="text-white/70 hover:text-primary transition-colors text-sm font-semibold" href="#">Categories</Link>
                        <Link className="text-white/70 hover:text-primary transition-colors text-sm font-semibold" href="#">My List</Link>
                    </nav>
                </div>
                <div className="flex items-center gap-6">
                    <div className="relative hidden md:block">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-xl">search</span>
                        <input className="bg-white/10 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary w-64 text-white placeholder:text-white/40" placeholder="Search titles..." type="text" />
                    </div>
                    <button className="md:hidden text-white">
                        <span className="material-symbols-outlined">search</span>
                    </button>
                    <div className="flex items-center gap-3">
                        {isLoggedIn && (
                            <>
                                <span className="material-symbols-outlined text-white/70 cursor-pointer hover:text-white">notifications</span>
                                <div
                                    className="size-9 rounded-full bg-cover bg-center border-2 border-primary/50 relative overflow-hidden cursor-pointer hover:border-primary transition-all active:scale-95"
                                    onClick={handleLogout}
                                    title="Logout"
                                >
                                    <Image
                                        src={user?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuD1Lf8ou0dErc0m7he9KunMHpoZUwHkhj8ivVp9cRwQ4mirIRJgnx_vIeGEnUtTLkYCKvlmYkFdb2joykQ0oV7gR_3PFj34pGk9-K3KR0IWd52SclJqQ9EzVsau7YEmrMYfR6oFnDaoAegwzxIQ7cw49DPaNUPO3vWht8VRkGTkWgbMydPRlrPZIZcJY1DQxmFRuicd6Cxv-h_tnrMtsx_yTNXQuwh625X2vYyrvMahidyo0JG6YSCm5kBK7QkI8HS24eOXJgXYPEU"}
                                        alt="User profile avatar portrait"
                                        fill
                                        sizes="36px"
                                        className="object-cover"
                                    />
                                </div>
                            </>
                        )}
                        {!isLoggedIn && !isLoading && (
                            <Link href="/login" className="bg-primary hover:bg-primary/80 text-secondary px-6 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
