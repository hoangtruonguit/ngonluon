'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, UserResponseDto } from '@/lib/api';

interface AuthContextType {
    user: UserResponseDto | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (user: UserResponseDto) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserResponseDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.getMe();
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = (userData: UserResponseDto) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await apiClient.logout();
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoggedIn: !!user,
                isLoading,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
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
