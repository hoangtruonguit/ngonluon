'use client';

interface StatCardProps {
    icon: string;
    label: string;
    value: number | string;
    trend?: { value: number; label: string };
    color: string;
    bg: string;
}

export default function StatCard({ icon, label, value, trend, color, bg }: StatCardProps) {
    return (
        <div className="bg-surface-dark border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
                <div className={`${bg} w-10 h-10 rounded-xl flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-xl ${color}`}>{icon}</span>
                </div>
                {trend && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                        trend.value >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                    }`}>
                        {trend.value >= 0 ? '+' : ''}{trend.value} {trend.label}
                    </span>
                )}
            </div>
            <p className="text-white/50 text-sm mb-1">{label}</p>
            <p className="text-white text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
    );
}
