'use client';

import { ResponsiveContainer, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Line, ComposedChart } from 'recharts';
import { WatchActivityPoint } from '@/services/admin.service';

interface WatchActivityChartProps {
    data: WatchActivityPoint[];
}

export default function WatchActivityChart({ data }: WatchActivityChartProps) {
    return (
        <div className="bg-surface-dark border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-1">Watch Activity</h3>
            <p className="text-white/30 text-xs mb-4">Views &amp; Watch Hours</p>
            <div className="h-72">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="date"
                                stroke="rgba(255,255,255,0.3)"
                                fontSize={12}
                                tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" fontSize={12} allowDecimals={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a2e',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '12px',
                                }}
                                labelFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                            />
                            <Bar yAxisId="left" dataKey="views" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Views" />
                            <Line yAxisId="right" type="monotone" dataKey="watchHours" stroke="#34d399" strokeWidth={2} dot={false} name="Watch Hours" />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-white/30 text-sm">No data available</div>
                )}
            </div>
        </div>
    );
}
