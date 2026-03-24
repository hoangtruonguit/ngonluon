'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function PremiumLockOverlay() {
    const t = useTranslations('Subscription');
    const router = useRouter();

    return (
        <div className="relative w-full aspect-video bg-black/80 rounded-2xl overflow-hidden flex items-center justify-center">
            {/* Background blur effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-black/90" />

            <div className="relative z-10 text-center px-6 py-12">
                <span className="material-symbols-outlined text-6xl text-primary/80 mb-4 block">lock</span>
                <h2 className="text-2xl font-bold text-white mb-2">{t('premiumRequired')}</h2>
                <p className="text-white/50 mb-6 max-w-md">{t('subscriptionRequired')}</p>
                <button
                    onClick={() => router.push('/pricing')}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all"
                >
                    {t('upgrade')}
                </button>
            </div>
        </div>
    );
}
