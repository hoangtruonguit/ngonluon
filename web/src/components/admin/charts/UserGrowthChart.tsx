'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TimeSeriesPoint } from '@/services/admin.service';

interface UserGrowthChartProps {
    data: TimeSeriesPoint[];
}

export default function UserGrowthChart({ data }: UserGrowthChartProps) {
    return (
        <div className="bg-surface-dark border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">User Growth</h3>
            <div className="h-72">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="date"
                                stroke="rgba(255,255,255,0.3)"
                                fontSize={12}
                                tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a2e',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '12px',
                                }}
                                labelFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                                formatter={(val: number) => [val, 'New Users']}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#60a5fa"
                                fill="url(#userGrowthGradient)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-white/30 text-sm">No data available</div>
                )}
            </div>
        </div>
    );
}
