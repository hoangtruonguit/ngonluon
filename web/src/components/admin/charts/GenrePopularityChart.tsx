'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { GenrePopularityItem } from '@/services/admin.service';

interface GenrePopularityChartProps {
    data: GenrePopularityItem[];
}

export default function GenrePopularityChart({ data }: GenrePopularityChartProps) {
    return (
        <div className="bg-surface-dark border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Genre Popularity</h3>
            <div className="h-72">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                            <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                            <YAxis
                                type="category"
                                dataKey="genre"
                                stroke="rgba(255,255,255,0.3)"
                                fontSize={11}
                                width={90}
                                tick={{ fill: 'rgba(255,255,255,0.6)' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a2e',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '12px',
                                }}
                            />
                            <Bar dataKey="views" fill="#60a5fa" radius={[0, 4, 4, 0]} name="Views" />
                            <Bar dataKey="watchlistCount" fill="#f472b6" radius={[0, 4, 4, 0]} name="Watchlist" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-white/30 text-sm">No data available</div>
                )}
            </div>
        </div>
    );
}
