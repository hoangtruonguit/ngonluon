'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import { Link, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import Footer from '@/components/layout/Footer';
import { apiClient } from '@/lib/api';

// Hoist static JSX (rendering-hoist-jsx)
const staticBackground = (
    <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="relative w-full h-full">
            <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOW5Z3hbv4EoYk4O6cTcAdWc0E9L7s53Y3Qyd9ENdCtFuI5ztSliqBOCUDDr5WDtbYYMmS-vlCprmPzm9lmdQpGO_JouqSw8pkivCumf680xcs6HjRfTas8DVh7QFaL0NHhTwNzFp4euvn5UaEGf7LJFaMiy1moYaGzV6L1xhTkXrvg7FobFN5rUU5XngYMEjTr2pk3r_5051D_4UfOamvyZ_rYftBqNzv2-E7Gm3kapzfgNkcKwVIIFhr9-kEk96gGs2KlXNOb-0"
                alt="Blurred cinematic movie theater seats background"
                fill
                sizes="100vw"
                className="object-cover scale-110 blur-md opacity-50"
            />
        </div>
    </div>
);

export default function LoginPage() {
    const t = useTranslations('Login');
    const tFooter = useTranslations('Footer');
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await apiClient.login(email, password);
            login(response.data.user);
            router.push('/');
        } catch (err: unknown) {
            console.error('Login failed:', err);
            const errorObj = err as { message?: string };
            setError(errorObj.message || 'An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col">
            {/* Background Cinematic Layer */}
            {staticBackground}

            {/* Layout Container */}
            <div className="relative z-20 flex flex-col min-h-screen">
                {/* TopNavBar */}
                <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-6 md:px-10 py-4">
                    <Link href="/" className="flex items-center gap-4 text-white">
                        <div className="size-8 text-primary">
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                            </svg>
                        </div>
                        <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">MovieStream</h2>
                    </Link>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors">
                            <span className="truncate">{tFooter('help')}</span>
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="flex flex-col w-full max-w-[450px]">
                        {/* Login Card */}
                        <div className="glass-card rounded-xl p-8 md:p-10 shadow-2xl">
                            <div className="mb-8">
                                <h1 className="text-white tracking-tight text-[32px] font-bold leading-tight text-center">{t('title')}</h1>
                                <p className="text-[#c9929b] text-center mt-2 text-sm font-normal">{t('subtitle')}</p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
                                    {error}
                                </div>
                            )}

                            {/* Form */}
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                {/* TextField: Email */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-white text-sm font-medium leading-normal">{t('emailLabel')}</p>
                                    <input
                                        className="flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-white/5 focus:bg-white/10 h-14 placeholder:text-[#c9929b]/50 p-4 text-base font-normal transition-all"
                                        placeholder={t('emailPlaceholder')}
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                {/* TextField: Password */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-white text-sm font-medium leading-normal">{t('passwordLabel')}</p>
                                    <div className="relative flex w-full items-stretch">
                                        <input
                                            className="flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-white/5 focus:bg-white/10 h-14 placeholder:text-[#c9929b]/50 p-4 text-base font-normal transition-all"
                                            placeholder={t('passwordPlaceholder')}
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                        />
                                        <div
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c9929b] cursor-pointer hover:text-white transition-colors"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <span className="material-symbols-outlined" data-icon={showPassword ? "visibility_off" : "visibility"}>
                                                {showPassword ? "visibility_off" : "visibility"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* Utils Row */}
                                <div className="flex items-center justify-between px-1 py-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input className="rounded border-none bg-white/10 text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer h-4 w-4" type="checkbox" />
                                        <span className="text-[#c9929b] text-sm font-normal group-hover:text-white">{t('rememberMe')}</span>
                                    </label>
                                    <Link className="text-sm font-medium text-primary hover:text-primary/80 transition-colors" href="#">{t('forgotPassword')}</Link>
                                </div>
                                {/* Primary Button */}
                                <button
                                    className={`neon-glow flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-4 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] transition-all transform active:scale-[0.98] mt-4 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>{t('signingIn')}</span>
                                        </div>
                                    ) : (
                                        <span className="truncate">{t('signIn')}</span>
                                    )}
                                </button>
                            </form>
                            {/* Divider */}
                            <div className="flex items-center my-8 gap-4">
                                <div className="h-[1px] flex-1 bg-white/10"></div>
                                <span className="text-[#c9929b] text-xs font-bold uppercase tracking-widest">{t('or')}</span>
                                <div className="h-[1px] flex-1 bg-white/10"></div>
                            </div>
                            {/* Social Logins */}
                            <div className="grid grid-cols-2 gap-4">
                                <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg h-12 transition-all group">
                                    <div className="relative w-5 h-5">
                                        <Image
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAw2uGX3guDgm71UShE77XZmsRy5chC15E-DJWOqc4KM8g2SGa_ZeHQuS3IGO8M-A9ZLbVEMhZYh6mkvytCvipkQc6Qmgu2Wy2Xmm6SOZTugGV5fHkaE3ro6HOiDp4aJYbuEEGQsuAGYUG1fqmfbYxYamLsmE-ZwBjiK0-WuFTCufdqgvqkKdcekkT4ppfpSVypMVApKgFAZtKHpawRFSu6tJ_NcY_h72ssTbXJKMBcqFyHM8Pz6jaqAXEtHGUV7ebCk5sNANNvMzo"
                                            alt="Google logo"
                                            fill
                                            sizes="20px"
                                            className="object-contain"
                                        />
                                    </div>
                                    <span className="text-white text-sm font-medium">{t('google')}</span>
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg h-12 transition-all">
                                    <span className="material-symbols-outlined text-white text-[20px]">ios</span>
                                    <span className="text-white text-sm font-medium">{t('apple')}</span>
                                </button>
                            </div>
                            {/* Footer CTA */}
                            <div className="mt-8 text-center">
                                <p className="text-[#c9929b] text-sm">
                                    {t('newToMovieStream')}
                                    <Link className="text-primary font-bold hover:underline ml-1" href="/register">{t('signUpNow')}</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
                {/* Page Footer */}
                <Footer />
            </div>
        </div>
    );
}
