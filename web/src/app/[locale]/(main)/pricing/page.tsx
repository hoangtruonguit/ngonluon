'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { subscriptionService, Plan, Subscription } from '@/services/subscription.service';
import { useAuth } from '@/contexts/AuthContext';

const FREE_FEATURES = ['SD quality', 'With ads', 'Free movies only', '1 device'];

export default function PricingPage() {
    const t = useTranslations('Pricing');
    const searchParams = useSearchParams();
    const { isLoggedIn, openLoginPrompt } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');

    useEffect(() => {
        async function load() {
            try {
                const [planData, subData] = await Promise.all([
                    subscriptionService.getPlans(),
                    subscriptionService.getMySubscription(),
                ]);
                setPlans(planData);
                setCurrentSub(subData);
            } catch {
                // Plans endpoint is public, subscription might fail if not logged in
                try {
                    const planData = await subscriptionService.getPlans();
                    setPlans(planData);
                } catch { /* ignore */ }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [success]);

    const handleSubscribe = async (planName: string) => {
        if (!isLoggedIn) {
            openLoginPrompt();
            return;
        }
        setCheckoutLoading(planName);
        try {
            const { url } = await subscriptionService.createCheckoutSession(planName);
            if (url) window.location.href = url;
        } catch (err: unknown) {
            const error = err as { message?: string };
            alert(error?.message || 'Failed to create checkout session');
        } finally {
            setCheckoutLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-40 lg:pt-48 pb-24 px-4 flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
                <h1 className="text-5xl md:text-6xl font-bold text-center text-white mb-4 tracking-tight">
                    {t('title')}
                </h1>
                <p className="text-gray-400 text-center mb-16 text-xl">
                    {t('subtitle')}
                </p>

                {/* Success / Cancel banners */}
                {success && (
                    <div className="mb-10 p-5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-center font-medium text-lg">
                        {t('successMessage')}
                    </div>
                )}
                {cancelled && (
                    <div className="mb-10 p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-center font-medium text-lg">
                        {t('cancelledMessage')}
                    </div>
                )}

                {/* Plans layout */}
                <div className="flex flex-col lg:flex-row justify-center items-center lg:items-stretch gap-8 lg:gap-10 mb-32 flex-1">
                    {/* Free plan */}
                    <div className="w-full lg:flex-1 max-w-[420px] bg-surface-dark border border-white/5 rounded-[2rem] p-8 sm:p-12 lg:p-14 flex flex-col shrink-0">
                        <h3 className="text-[16px] font-bold text-gray-300 tracking-[0.15em] uppercase mb-6">Free</h3>
                        <div className="mb-10 flex items-baseline gap-2">
                            <span className="text-7xl font-extrabold text-white">$0</span>
                            <span className="text-gray-400 text-lg font-medium">/mo</span>
                        </div>
                        <button
                            disabled
                            className="w-full py-5 mb-14 rounded-xl bg-white/5 text-gray-400 text-base font-bold transition-colors cursor-not-allowed"
                        >
                            {currentSub ? t('freePlan') : t('currentPlan')}
                        </button>
                        <ul className="space-y-6 flex-1">
                            {FREE_FEATURES.map((f) => {
                                const isNegative = f.toLowerCase().includes('no ') || f.toLowerCase().includes('with ads');
                                return (
                                    <li key={f} className="flex items-center gap-5 text-gray-300 text-[16px] font-semibold tracking-wide">
                                        {isNegative ? (
                                            <span className="material-symbols-outlined text-[24px] text-gray-600" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[24px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        )}
                                        {f}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Paid plans */}
                    {plans.map((plan, index) => {
                        const isCurrentPlan = currentSub?.planName === plan.name && currentSub?.status === 'ACTIVE';
                        const isHighlighted = index === 0;

                        return (
                            <div
                                key={plan.name}
                                className={`w-full lg:flex-1 max-w-[420px] rounded-[2rem] p-8 sm:p-12 lg:p-14 flex flex-col relative shrink-0 ${
                                    isHighlighted
                                        ? 'bg-surface-dark border-2 border-primary shadow-[0_0_50px_rgba(255,0,0,0.15)] shadow-primary/20 z-10 scale-100 lg:scale-[1.03]'
                                        : 'bg-surface-dark border border-white/5'
                                }`}
                            >
                                {isHighlighted && (
                                    <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 flex flex-col items-center">
                                        <div className="bg-primary text-secondary text-[12px] font-extrabold tracking-[0.2em] uppercase px-6 py-2 rounded-full whitespace-nowrap shadow-xl">
                                            Most Popular
                                        </div>
                                    </div>
                                )}
                                <h3 className="text-[16px] font-bold text-gray-300 tracking-[0.15em] uppercase mb-6">{plan.name}</h3>
                                <div className="mb-10 flex items-baseline gap-2">
                                    <span className="text-7xl font-extrabold text-white">
                                        ${plan.price.toFixed(2)}
                                    </span>
                                    <span className="text-gray-400 text-lg font-medium">/mo</span>
                                </div>
                                {isCurrentPlan ? (
                                    <button
                                        disabled
                                        className="w-full py-5 mb-14 rounded-xl bg-green-500/10 text-green-500 text-base font-bold transition-colors cursor-not-allowed"
                                    >
                                        {t('currentPlan')}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleSubscribe(plan.name)}
                                        disabled={!!checkoutLoading}
                                        className={`w-full py-5 mb-14 rounded-xl text-base font-bold transition-all ${
                                            isHighlighted
                                                ? 'bg-primary text-secondary hover:bg-primary/90 shadow-xl shadow-primary/30'
                                                : 'bg-white/10 text-white hover:bg-white/20'
                                        } disabled:opacity-50`}
                                    >
                                        {checkoutLoading === plan.name ? t('redirecting') : 'Select Plan'}
                                    </button>
                                )}
                                <ul className="space-y-6 flex-1">
                                    {plan.features.map((f) => {
                                        const isNegative = f.toLowerCase().includes('no offline') || f.toLowerCase() === 'ads' || f.toLowerCase().includes('ad-supported');
                                        return (
                                            <li key={f} className="flex items-center gap-5 text-gray-300 text-[16px] font-semibold tracking-wide">
                                                {isNegative ? (
                                                    <span className="material-symbols-outlined text-[24px] text-gray-600" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-[24px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                )}
                                                {f}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {/* Separator line */}
                <div className="w-full h-[1px] bg-white/5 my-16 lg:my-20 max-w-5xl mx-auto rounded-full mt-auto" />

                {/* Devices block */}
                <div className="text-center pb-8">
                    <h4 className="text-sm text-gray-500/80 tracking-widest font-bold uppercase mb-12">
                        Available on your favorite devices
                    </h4>
                    <div className="flex justify-center items-center gap-16 sm:gap-32 flex-wrap">
                        <div className="flex flex-col items-center gap-5 text-gray-400/80 hover:text-white transition-colors cursor-pointer group">
                            <span className="material-symbols-outlined text-5xl group-hover:scale-110 transition-transform">tv</span>
                            <span className="text-[12px] font-bold tracking-[0.15em]">Smart TV</span>
                        </div>
                        <div className="flex flex-col items-center gap-5 text-gray-400/80 hover:text-white transition-colors cursor-pointer group">
                            <span className="material-symbols-outlined text-5xl group-hover:scale-110 transition-transform">laptop_mac</span>
                            <span className="text-[12px] font-bold tracking-[0.15em]">Laptop</span>
                        </div>
                        <div className="flex flex-col items-center gap-5 text-gray-400/80 hover:text-white transition-colors cursor-pointer group">
                            <span className="material-symbols-outlined text-5xl group-hover:scale-110 transition-transform">smartphone</span>
                            <span className="text-[12px] font-bold tracking-[0.15em]">Mobile</span>
                        </div>
                        <div className="flex flex-col items-center gap-5 text-gray-400/80 hover:text-white transition-colors cursor-pointer group">
                            <span className="material-symbols-outlined text-5xl group-hover:scale-110 transition-transform">videogame_asset</span>
                            <span className="text-[12px] font-bold tracking-[0.15em]">Consoles</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
