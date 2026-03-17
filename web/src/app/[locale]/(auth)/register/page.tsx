'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('@/components/Footer'));

// Hoist RegEx outside render (js-hoist-regexp)
const EMAIL_REGEX = /\S+@\S+\.\S+/;
const LOWER_REGEX = /[a-z]/;
const UPPER_REGEX = /[A-Z]/;
const NUM_REGEX = /[0-9]/;
const SPECIAL_REGEX = /[^a-zA-Z0-9]/;

// Hoist static JSX (rendering-hoist-jsx)
const staticBackground = (
    <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#211111]/80 to-[#211111]"></div>
        <Image
            src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925"
            alt="Cinematic background"
            fill
            sizes="100vw"
            className="object-cover"
            priority
        />
    </div>
);

export default function RegisterPage() {
    const router = useRouter();
    const t = useTranslations('Register');
    const tLogin = useTranslations('Login');
    const tValidation = useTranslations('Validation');
    const tFooter = useTranslations('Footer');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        termsAccepted: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = tValidation('emailRequired');
        } else if (!EMAIL_REGEX.test(formData.email)) {
            newErrors.email = tValidation('emailInvalid');
        }

        if (!formData.password) {
            newErrors.password = tValidation('passwordRequired');
        } else if (formData.password.length < 8) {
            newErrors.password = tValidation('passwordLength');
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = tValidation('confirmPasswordRequired');
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = tValidation('passwordsMatch');
        }

        if (!formData.fullName) {
            newErrors.fullName = tValidation('fullNameRequired');
        }

        if (!formData.termsAccepted) {
            newErrors.termsAccepted = tValidation('termsAccepted');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const data = await apiClient.register({
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                fullName: formData.fullName,
                termsAccepted: formData.termsAccepted
            });

            // Success! Redirect to login
            router.push('/login?registered=true');
        } catch (error: unknown) {
            console.error('Registration error:', error);

            const err = error as { statusCode?: number; message?: string | string[] };
            // Handle structured error from apiClient
            if (err.statusCode) {
                if (Array.isArray(err.message)) {
                    const errorObj: Record<string, string> = {};
                    err.message.forEach((msg: string) => {
                        errorObj.general = msg;
                    });
                    setErrors(errorObj);
                } else {
                    setErrors({ general: err.message || tValidation('networkError') });
                }
            } else {
                setErrors({ general: tValidation('networkError') });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getPasswordStrength = () => {
        const password = formData.password;
        if (!password) return 0;

        let strength = 0;
        if (password.length >= 8) strength++;
        if (LOWER_REGEX.test(password) && UPPER_REGEX.test(password)) strength++;
        if (NUM_REGEX.test(password)) strength++;
        if (SPECIAL_REGEX.test(password)) strength++;

        return strength;
    };

    const passwordStrength = getPasswordStrength();

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden">
            {/* Background */}
            {staticBackground}

            {/* Content */}
            <div className="relative z-10 flex h-full grow flex-col">
                {/* Header */}
                <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-6 md:px-10 py-4">
                    <Link href="/" className="flex items-center gap-4 text-white">
                        <div className="size-8 text-primary">
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4C24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                            </svg>
                        </div>
                        <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">MovieStream</h2>
                    </Link>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <div className="flex items-center gap-4">
                            <p className="hidden md:block text-sm text-[#ad9db9]">{t('alreadyMember')}</p>
                            <Link
                                href="/login"
                                className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors"
                            >
                                <span className="truncate">{t('signIn')}</span>
                            </Link>
                        </div>
                        <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors">
                            <span className="truncate">{tFooter('help')}</span>
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex flex-1 items-center justify-center px-4 py-12">
                    <div className="w-full max-w-[520px] rounded-2xl p-8 md:p-10 shadow-2xl" style={{
                        background: 'rgba(34, 28, 39, 0.8)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(157, 43, 238, 0.1)'
                    }}>

                        {/* Title */}
                        <div className="mb-8">
                            <h1 className="text-white text-3xl font-bold leading-tight text-left">{t('title')}</h1>
                            <p className="text-[#ad9db9] mt-2">{t('subtitle')}</p>
                        </div>

                        {/* Error Message */}
                        {errors.general && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400 text-sm">{errors.general}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {/* Full Name */}
                            <div className="flex flex-col gap-2">
                                <label className="text-white text-sm font-medium">{t('fullNameLabel')}</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#ad9db9] group-focus-within:text-[#EA2831]">person</span>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#EA2831]/50 border border-white/10 bg-white/5 focus:border-[#EA2831] h-14 placeholder:text-[#ad9db9]/50 pl-12 pr-4 text-base font-normal"
                                        placeholder={t('fullNamePlaceholder')}
                                    />
                                </div>
                                {errors.fullName && <p className="text-red-400 text-xs">{errors.fullName}</p>}
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-2">
                                <label className="text-white text-sm font-medium">{t('emailLabel')}</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#ad9db9] group-focus-within:text-[#EA2831]">mail</span>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#EA2831]/50 border border-white/10 bg-white/5 focus:border-[#EA2831] h-14 placeholder:text-[#ad9db9]/50 pl-12 pr-4 text-base font-normal"
                                        placeholder={t('emailPlaceholder')}
                                    />
                                </div>
                                {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div className="flex flex-col gap-2">
                                <label className="text-white text-sm font-medium">{t('passwordLabel')}</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#ad9db9] group-focus-within:text-[#EA2831]">lock</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#EA2831]/50 border border-white/10 bg-white/5 focus:border-[#EA2831] h-14 placeholder:text-[#ad9db9]/50 pl-12 pr-12 text-base font-normal"
                                        placeholder={t('passwordPlaceholder')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ad9db9] hover:text-white transition"
                                    >
                                        <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                                {/* Password Strength */}
                                <div className="mt-1 flex gap-1 h-1">
                                    {[1, 2, 3, 4].map((level) => {
                                        const strengthColors = ['', 'bg-red-500', 'bg-pink-500', 'bg-yellow-500', 'bg-green-500'];
                                        return (
                                            <div
                                                key={level}
                                                className={`flex-1 rounded-full ${level <= passwordStrength ? strengthColors[passwordStrength] : 'bg-white/10'
                                                    }`}
                                            ></div>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-[#ad9db9]">{t('passwordHint')}</p>
                                {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div className="flex flex-col gap-2">
                                <label className="text-white text-sm font-medium">{t('confirmPasswordLabel')}</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#ad9db9] group-focus-within:text-[#EA2831]">lock_reset</span>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="flex w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-[#EA2831]/50 border border-white/10 bg-white/5 focus:border-[#EA2831] h-14 placeholder:text-[#ad9db9]/50 pl-12 pr-12 text-base font-normal"
                                        placeholder={t('passwordPlaceholder')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ad9db9] hover:text-white transition"
                                    >
                                        <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword}</p>}
                            </div>

                            {/* Terms */}
                            <div className="flex items-start gap-3 mt-2">
                                <input
                                    type="checkbox"
                                    name="termsAccepted"
                                    checked={formData.termsAccepted}
                                    onChange={handleChange}
                                    className="rounded border-white/20 bg-white/5 text-[#EA2831] focus:ring-[#EA2831] h-4 w-4 mt-0.5"
                                />
                                <p className="text-sm text-[#ad9db9] leading-tight">
                                    {t('termsAgree')} <a className="text-[#EA2831] hover:underline" href="#">{t('termsOfService')}</a> {t('and')} <a className="text-[#EA2831] hover:underline" href="#">{t('privacyPolicy')}</a>.
                                </p>
                            </div>
                            {errors.termsAccepted && <p className="text-red-400 text-xs">{errors.termsAccepted}</p>}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-4 flex w-full cursor-pointer items-center justify-center rounded-lg h-14 bg-[#EA2831] text-white text-base font-bold transition hover:bg-[#EA2831]/90 shadow-lg shadow-[#EA2831]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? t('submittingButton') : t('submitButton')}
                            </button>
                        </form>

                        {/* Social Login */}
                        <div className="flex items-center gap-4 my-8">
                            <div className="h-px grow bg-white/10"></div>
                            <span className="text-xs text-[#ad9db9] font-bold uppercase">{t('orSignUpWith')}</span>
                            <div className="h-px grow bg-white/10"></div>
                        </div>

                        <div className="flex gap-4">
                            <button className="flex-1 flex items-center justify-center gap-2 rounded-lg h-12 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                                <span className="text-sm font-medium">{tLogin('google')}</span>
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 rounded-lg h-12 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                                <span className="text-sm font-medium">{tLogin('apple')}</span>
                            </button>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <Footer />
            </div>
        </div>
    );
}
