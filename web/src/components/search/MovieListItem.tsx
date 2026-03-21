'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

interface MovieListItemProps {
    id: string;
    title: string;
    rating?: string;
    description: string;
    imageUrl: string;
    showWatchButton: boolean;
    slug: string;
    releaseYear?: number;
}

export default function MovieListItem({
    title,
    rating,
    description,
    imageUrl,
    showWatchButton,
    slug,
    releaseYear
}: MovieListItemProps) {
    const t = useTranslations('Common');

    return (
        <div className="group flex flex-col md:flex-row gap-6 p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-500 overflow-hidden">
            {/* Poster Section */}
            <div className="relative aspect-[2/3] md:w-32 lg:w-48 shrink-0 overflow-hidden rounded-2xl shadow-2xl">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-grow py-2">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="space-y-1">
                        <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{title}</h3>
                        <div className="flex items-center gap-3">
                            {rating && (
                                <div className="flex items-center gap-2">
                                    <span className="text-primary font-black text-lg">{rating}</span>
                                    <span className="text-white/50 text-[10px] uppercase font-black tracking-widest">IMDb</span>
                                </div>
                            )}
                            {releaseYear && (
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                                    {releaseYear}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 gap-2 w-full sm:w-auto">
                        {showWatchButton && (
                            <Link
                                href={`/watch/${slug}`}
                                className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-secondary font-black rounded-xl text-sm flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300"
                            >
                                <span className="material-symbols-outlined text-lg">play_arrow</span>
                                {t('watchNow')}
                            </Link>
                        )}
                        <Link
                            href={`/watch/${slug}`}
                            className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors hidden sm:flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-xl">info</span>
                        </Link>
                    </div>
                </div>

                <p className="text-white/50 text-sm leading-relaxed line-clamp-3 md:line-clamp-4 max-w-3xl mb-auto">
                    {description}
                </p>
                
                {/* Additional metadata can go here if needed (genres, runtime, etc) */}
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-4">
                     {/* Placeholder for more metadata */}
                </div>
            </div>
        </div>
    );
}
