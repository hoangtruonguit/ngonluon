'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient, UserResponseDto, WatchlistItemResponseDto } from '@/lib/api';
import { useRouter } from '@/i18n/routing';

interface AuthContextType {
    user: UserResponseDto | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    watchlistIds: Set<string>;
    showLoginPrompt: boolean;
    login: (user: UserResponseDto) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    updateWatchlist: (movieId: string, isInWatchlist: boolean) => void;
    openLoginPrompt: () => void;
    closeLoginPrompt: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import LoginPromptModal from '@/components/ui/LoginPromptModal';

function hasAuthCookie(): boolean {
    if (typeof window === 'undefined') return false;
    return document.cookie.includes('is_logged_in=');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<UserResponseDto | null>(null);
    const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const fetchWatchlist = useCallback(async () => {
        try {
            const response = await apiClient.getWatchlist();
            const ids = new Set(response.data.map((item: WatchlistItemResponseDto) => item.movieId || item.id));
            setWatchlistIds(ids);
        } catch {
            console.error('Failed to fetch watchlist');
        }
    }, []);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const refreshUser = useCallback(async () => {
        if (!hasAuthCookie()) {
            setUser(null);
            setWatchlistIds(new Set());
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await apiClient.getMe();
            setUser(response.data);
            await fetchWatchlist();
        } catch {
            setUser(null);
            setWatchlistIds(new Set());
        } finally {
            setIsLoading(false);
        }
    }, [fetchWatchlist]);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = (userData: UserResponseDto) => {
        setUser(userData);
        fetchWatchlist();
    };

    const logout = async () => {
        try {
            await apiClient.logout();
            setUser(null);
            setWatchlistIds(new Set());
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            setUser(null);
            setWatchlistIds(new Set());
            router.push('/login');
        }
    };

    const updateWatchlist = (movieId: string, isInWatchlist: boolean) => {
        setWatchlistIds(prev => {
            const next = new Set(prev);
            if (isInWatchlist) next.add(movieId);
            else next.delete(movieId);
            return next;
        });
    };

    const openLoginPrompt = () => setShowLoginPrompt(true);
    const closeLoginPrompt = () => setShowLoginPrompt(false);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoggedIn: !!user,
                isLoading,
                watchlistIds,
                showLoginPrompt,
                login,
                logout,
                refreshUser,
                updateWatchlist,
                openLoginPrompt,
                closeLoginPrompt,
            }}
        >
            {children}
            <LoginPromptModal isOpen={showLoginPrompt} onClose={closeLoginPrompt} />
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
