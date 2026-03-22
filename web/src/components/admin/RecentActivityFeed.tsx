'use client';

import { ActivityFeedItem } from '@/services/admin.service';

interface RecentActivityFeedProps {
    items: ActivityFeedItem[];
    loading?: boolean;
}

function getActivityIcon(type: ActivityFeedItem['type']) {
    switch (type) {
        case 'review': return { icon: 'star', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
        case 'comment': return { icon: 'chat_bubble', color: 'text-blue-400', bg: 'bg-blue-500/10' };
        case 'registration': return { icon: 'person_add', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    }
}

function getActivityText(item: ActivityFeedItem) {
    switch (item.type) {
        case 'review':
            return `rated "${item.movieTitle}" ${item.rating}/5`;
        case 'comment':
            return `commented on "${item.movieTitle}"`;
        case 'registration':
            return 'joined the platform';
    }
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function RecentActivityFeed({ items, loading }: RecentActivityFeedProps) {
    if (loading) {
        return (
            <div className="bg-surface-dark border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-lg bg-white/5" />
                            <div className="flex-1 h-4 rounded bg-white/5" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-dark border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
            {items.length === 0 ? (
                <p className="text-white/30 text-sm">No recent activity</p>
            ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {items.map((item, i) => {
                        const { icon, color, bg } = getActivityIcon(item.type);
                        return (
                            <div key={`${item.type}-${item.createdAt}-${i}`} className="flex items-start gap-3">
                                <div className={`${bg} w-8 h-8 rounded-lg flex items-center justify-center shrink-0`}>
                                    <span className={`material-symbols-outlined text-sm ${color}`}>{icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/80 text-sm truncate">
                                        <span className="font-semibold text-white">{item.user.fullName ?? 'User'}</span>
                                        {' '}{getActivityText(item)}
                                    </p>
                                    <p className="text-white/30 text-xs" suppressHydrationWarning>{timeAgo(item.createdAt)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
