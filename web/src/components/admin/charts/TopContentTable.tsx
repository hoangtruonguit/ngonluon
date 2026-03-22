'use client';

import { TopContentItem } from '@/services/admin.service';

interface TopContentTableProps {
    title: string;
    data: TopContentItem[];
    valueLabel: string;
}

export default function TopContentTable({ title, data, valueLabel }: TopContentTableProps) {
    return (
        <div className="bg-surface-dark border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">{title}</h3>
            {data.length > 0 ? (
                <div className="space-y-2">
                    {data.map((item, i) => (
                        <div key={item.movieId} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                            <span className="text-white/30 text-sm w-6 text-right">{i + 1}</span>
                            {item.posterUrl ? (
                                <img
                                    src={item.posterUrl.startsWith('http') ? item.posterUrl : `https://image.tmdb.org/t/p/w92${item.posterUrl}`}
                                    alt={item.title}
                                    className="w-8 h-12 rounded object-cover bg-white/5"
                                />
                            ) : (
                                <div className="w-8 h-12 rounded bg-white/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white/20 text-sm">movie</span>
                                </div>
                            )}
                            <span className="flex-1 text-white/80 text-sm truncate">{item.title}</span>
                            <span className="text-white font-semibold text-sm">{item.value.toLocaleString()}</span>
                            <span className="text-white/30 text-xs">{valueLabel}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-white/30 text-sm">No data available</p>
            )}
        </div>
    );
}
