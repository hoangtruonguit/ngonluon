'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Breadcrumb from '@/components/Breadcrumb';
import ProfileInfo from '@/components/profile/ProfileInfo';
import WatchlistSection from '@/components/profile/WatchlistSection';
import WatchHistorySection from '@/components/profile/WatchHistorySection';
import { WatchlistItemResponseDto, WatchHistoryResponseDto } from '@/lib/api';

export default function ProfilePage() {
    const { user, isLoggedIn, isLoading: authLoading, refreshUser } = useAuth();
    const router = useRouter();
    const t = useTranslations('Profile');
    const tHeader = useTranslations('Header');

    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [watchlist, setWatchlist] = useState<WatchlistItemResponseDto[]>([]);
    const [watchHistory, setWatchHistory] = useState<WatchHistoryResponseDto[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, authLoading, router]);

    useEffect(() => {
        if (user) {
            // Fetch watchlist and history
            const fetchData = async () => {
                setIsDataLoading(true);
                try {
                    const [wlResponse, whResponse] = await Promise.all([
                        apiClient.getWatchlist(),
                        apiClient.getWatchHistory()
                    ]);
                    setWatchlist(wlResponse.data);
                    setWatchHistory(whResponse.data);
                } catch (error) {
                    console.error('Failed to fetch user data', error);
                } finally {
                    setIsDataLoading(false);
                }
            };
            fetchData();
        }
    }, [user]);

    const handleUpdateProfile = async (data: { fullName: string; avatarUrl?: string }) => {
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
    };

    if (authLoading || !isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20 bg-background-dark text-white">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const breadcrumbItems = [
        { label: tHeader('home'), href: '/' },
        { label: tHeader('myProfile'), active: true }
    ];

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

                    {/* Content Sections */}
                    <div className="space-y-32">
                        <WatchlistSection
                            items={watchlist}
                            isLoading={isDataLoading}
                            onWatchlistUpdate={(movieId, isInWatchlist) => {
                                if (!isInWatchlist) {
                                    setWatchlist(prev => prev.filter(item => item.movieId !== movieId));
                                }
                            }}
                        />

                        <WatchHistorySection
                            items={watchHistory}
                            isLoading={isDataLoading}
                            onClear={() => setWatchHistory([])}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
