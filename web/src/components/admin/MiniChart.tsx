'use client';

import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from 'recharts';

interface MiniChartProps {
    data: { date: string; value: number }[];
    title: string;
    color: string;
    valueLabel?: string;
}

export default function MiniChart({ data, title, color, valueLabel = 'Value' }: MiniChartProps) {
    return (
        <div className="bg-surface-dark border border-white/10 rounded-2xl p-5">
            <h3 className="text-white/50 text-sm mb-3">{title}</h3>
            <div className="h-32">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" hide />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a2e',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '12px',
                                }}
                                labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                                formatter={(val) => [Number(val).toLocaleString(), valueLabel]}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                fill={`url(#gradient-${color})`}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-white/30 text-sm">No data</div>
                )}
            </div>
        </div>
    );
}
