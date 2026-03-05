'use client';

import { useState } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import Footer from '@/components/Footer';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function RegisterPage() {
    const router = useRouter();
    const t = useTranslations('Register');
    const tValidation = useTranslations('Validation');

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
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
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
            const response = await fetch('http://localhost:3001/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle API errors
                if (data.message) {
                    if (Array.isArray(data.message)) {
                        // Validation errors from class-validator
                        const errorObj: Record<string, string> = {};
                        data.message.forEach((msg: string) => {
                            errorObj.general = msg;
                        });
                        setErrors(errorObj);
                    } else {
                        setErrors({ general: data.message });
                    }
                } else {
                    setErrors({ general: tValidation('generalError') });
                }
                return;
            }

            // Success! Redirect to login
            router.push('/login?registered=true');
        } catch (error) {
            console.error('Registration error:', error);
            setErrors({ general: tValidation('networkError') });
        } finally {
            setIsLoading(false);
        }
    };

    const getPasswordStrength = () => {
        const password = formData.password;
        if (!password) return 0;

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        return strength;
    };

    const passwordStrength = getPasswordStrength();

    return (
        <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#211111]/80 to-[#211111]"></div>
                <div
                    className="h-full w-full bg-cover bg-center"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925')"
                    }}
                ></div>
            </div>

            {/* Content */}
            <div className="layout-container relative z-10 flex h-full grow flex-col">
                {/* Header */}
                <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-6 md:px-20 py-4">
                    <Link href="/" className="flex items-center gap-4 text-white">
                        <div className="size-6 text-[#EA2831]">
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fillRule="evenodd"></path>
                            </svg>
                        </div>
                        <h2 className="text-white text-xl font-bold leading-tight tracking-tight">CineStream</h2>
                    </Link>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <p className="hidden md:block text-sm text-[#ad9db9]">{t('alreadyMember')}</p>
                        <Link
                            href="/login"
                            className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-5 border border-[#EA2831] text-white text-sm font-bold transition hover:bg-[#EA2831]/10"
                        >
                            {t('signIn')}
                        </Link>
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
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`flex-1 rounded-full ${level <= passwordStrength ? 'bg-[#EA2831]' : 'bg-white/10'
                                                }`}
                                        ></div>
                                    ))}
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
                                <span className="text-sm font-medium">Google</span>
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 rounded-lg h-12 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                                <span className="text-sm font-medium">Apple</span>
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
