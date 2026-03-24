import { apiClient } from '@/lib/api';

export interface Plan {
    name: string;
    price: number;
    currency: string;
    interval: string;
    features: string[];
}

export interface Subscription {
    id: string;
    planName: string;
    status: string;
    startDate: string;
    endDate: string;
    cancelledAt: string | null;
    createdAt: string;
}

class SubscriptionService {
    async getPlans(): Promise<Plan[]> {
        const res = await apiClient.get<Plan[]>('/subscriptions/plans');
        return res.data;
    }

    async getMySubscription(): Promise<Subscription | null> {
        try {
            const res = await apiClient.get<Subscription>('/subscriptions/me');
            return res.data;
        } catch {
            return null;
        }
    }

    async getHistory(): Promise<Subscription[]> {
        const res = await apiClient.get<Subscription[]>('/subscriptions/history');
        return res.data;
    }

    async createCheckoutSession(planName: string): Promise<{ url: string }> {
        const res = await apiClient.post<{ url: string }>('/subscriptions/checkout', { planName });
        return res.data;
    }

    async cancelSubscription(): Promise<void> {
        await apiClient.post('/subscriptions/cancel', {});
    }
}

export const subscriptionService = new SubscriptionService();
