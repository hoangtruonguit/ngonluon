'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Subscription } from '@/services/subscription.service';

interface SubscriptionSectionProps {
    subscription: Subscription | null;
    history: Subscription[];
    onCancel: () => Promise<void>;
}

export default function SubscriptionSection({ subscription, history, onCancel }: SubscriptionSectionProps) {
    const t = useTranslations('Subscription');
    const router = useRouter();
    const [cancelling, setCancelling] = useState(false);

    const handleCancel = async () => {
        if (!confirm(t('cancelConfirm'))) return;
        setCancelling(true);
        try {
            await onCancel();
        } finally {
            setCancelling(false);
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'text-green-400 bg-green-500/10';
            case 'CANCELLED': return 'text-red-400 bg-red-500/10';
            case 'EXPIRED': return 'text-white/40 bg-white/5';
            default: return 'text-white/40 bg-white/5';
        }
    };

    return (
        <section>
            <h2 className="text-2xl font-bold text-white mb-6">{t('title')}</h2>

            {subscription ? (
                <div className="bg-surface-dark border border-white/10 rounded-2xl p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div>
                            <span className="text-white/50 text-sm">{t('plan')}</span>
                            <p className="text-white text-lg font-bold">{subscription.planName}</p>
                        </div>
                        <div>
                            <span className="text-white/50 text-sm">{t('status')}</span>
                            <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColor(subscription.status)}`}>
                                {subscription.cancelledAt ? t('cancelled') : t(subscription.status.toLowerCase() as 'active' | 'expired')}
                            </p>
                        </div>
                        <div>
                            <span className="text-white/50 text-sm">{t('nextBilling')}</span>
                            <p className="text-white">{new Date(subscription.endDate).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {subscription.status === 'ACTIVE' && !subscription.cancelledAt && (
                        <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-all disabled:opacity-50"
                        >
                            {cancelling ? '...' : t('cancel')}
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-surface-dark border border-white/10 rounded-2xl p-8 text-center">
                    <p className="text-white/50 mb-4">{t('noSubscription')}</p>
                    <button
                        onClick={() => router.push('/pricing')}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all"
                    >
                        {t('upgrade')}
                    </button>
                </div>
            )}

            {/* History */}
            {history.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-3">{t('history')}</h3>
                    <div className="space-y-2">
                        {history.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                                <span className="text-white font-medium">{sub.planName}</span>
                                <span className="text-white/50 text-sm">
                                    {new Date(sub.startDate).toLocaleDateString()} — {new Date(sub.endDate).toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(sub.status)}`}>
                                    {sub.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
