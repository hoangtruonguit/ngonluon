'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProfileInfo from '@/components/profile/ProfileInfo';
import WatchlistSection from '@/components/profile/WatchlistSection';
import WatchHistorySection from '@/components/profile/WatchHistorySection';
import SubscriptionSection from '@/components/profile/SubscriptionSection';
import { WatchlistItemResponseDto, WatchHistoryResponseDto } from '@/lib/api';
import { subscriptionService, Subscription } from '@/services/subscription.service';

const fetchWatchlist = () => apiClient.getWatchlist().then(res => res.data);
const fetchWatchHistory = () => apiClient.getWatchHistory().then(res => res.data);
const fetchSubscription = () => subscriptionService.getMySubscription();
const fetchSubHistory = () => subscriptionService.getHistory();

export default function ProfilePage() {
    const { user, isLoggedIn, isLoading: authLoading, refreshUser } = useAuth();
    const router = useRouter();
    const t = useTranslations('Profile');
    const tHeader = useTranslations('Header');

    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const {
        data: watchlist,
        isLoading: isWatchlistLoading,
        mutate: mutateWatchlist
    } = useSWR<WatchlistItemResponseDto[]>(
        user ? 'watchlist' : null,
        fetchWatchlist,
    );

    const {
        data: watchHistory,
        isLoading: isHistoryLoading,
        mutate: mutateHistory
    } = useSWR<WatchHistoryResponseDto[]>(
        user ? 'watch-history' : null,
        fetchWatchHistory,
    );

    const { data: currentSub, mutate: mutateSub } = useSWR<Subscription | null>(
        user ? 'my-subscription' : null,
        fetchSubscription,
    );

    const { data: subHistory } = useSWR<Subscription[]>(
        user ? 'sub-history' : null,
        fetchSubHistory,
    );

    const isDataLoading = isWatchlistLoading || isHistoryLoading;

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push('/login');
        }
    }, [authLoading, isLoggedIn, router]);

    const handleUpdateProfile = useCallback(async (data: { fullName: string; avatarUrl?: string }) => {
        setIsUpdating(true);
        setMessage(null);

        try {
            const updateData: { fullName: string; avatarUrl?: string } = { fullName: data.fullName };
            if (data.avatarUrl && data.avatarUrl.trim() !== '') {
                updateData.avatarUrl = data.avatarUrl;
            }

            await apiClient.updateProfile(updateData);
            await refreshUser();
            setMessage({ type: 'success', text: t('updateSuccess') });
        } catch (error: unknown) {
            console.error('Update profile error:', error);
            const err = error as { response?: { data?: { message?: string | string[] } }; message?: string };
            const errorText = err.response?.data?.message || err.message || t('updateError');
            setMessage({ type: 'error', text: Array.isArray(errorText) ? errorText[0] : errorText });
        } finally {
            setIsUpdating(false);
        }
    }, [refreshUser, t]);

    const handleWatchlistUpdate = useCallback((movieId: string, isInWatchlist: boolean) => {
        if (!isInWatchlist) {
            mutateWatchlist(
                (prev) => prev?.filter(item => item.movieId !== movieId),
                { revalidate: false }
            );
        }
    }, [mutateWatchlist]);

    const handleClearHistory = useCallback(() => {
        mutateHistory([], { revalidate: false });
    }, [mutateHistory]);

    const breadcrumbItems = useMemo(() => [
        { label: tHeader('home'), href: '/' },
        { label: tHeader('myProfile'), active: true }
    ], [tHeader]);

    if (authLoading || !isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20 bg-background-dark text-white">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-dark text-white pt-24 pb-20 font-sans">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-24">
                <div className="mb-12">
                    <Breadcrumb items={breadcrumbItems} />
                    <h1 className="text-4xl font-black mt-4">{t('myAccount')}</h1>
                </div>

                <div className="space-y-32">
                    {/* Profile Information */}
                    <ProfileInfo
                        user={user}
                        onUpdate={handleUpdateProfile}
                        isUpdating={isUpdating}
                        message={message}
                    />

                    {/* Subscription Section */}
                    <SubscriptionSection
                        subscription={currentSub ?? null}
                        history={subHistory ?? []}
                        onCancel={async () => {
                            await subscriptionService.cancelSubscription();
                            mutateSub();
                        }}
                    />

                    {/* Content Sections */}
                    <div className="space-y-32">
                        <WatchlistSection
                            items={watchlist ?? []}
                            isLoading={isDataLoading}
                            onWatchlistUpdate={handleWatchlistUpdate}
                        />

                        <WatchHistorySection
                            items={watchHistory ?? []}
                            isLoading={isDataLoading}
                            onClear={handleClearHistory}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
