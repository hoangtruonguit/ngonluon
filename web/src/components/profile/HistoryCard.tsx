'use client';

import Image from 'next/image';
import Link from 'next/link';
import { movieService } from '@/services/movie.service';
import { useTranslations } from 'next-intl';

interface HistoryCardProps {
    id: string;
    title: string;
    imageUrl: string;
    slug: string;
    progressSeconds: number;
    durationMinutes: number;
}

export default function HistoryCard({
    id,
    title,
    imageUrl,
    slug,
    progressSeconds,
    durationMinutes,
}: HistoryCardProps) {
    const t = useTranslations('Profile');
    const tCommon = useTranslations('Common');
    const highResImageUrl = movieService.getHighResImage(imageUrl);
    
    // Calculations
    const totalSeconds = (durationMinutes || 0) * 60;
    const progressPercent = totalSeconds > 0 ? (progressSeconds / totalSeconds) * 100 : 0;
    const remainingMinutes = Math.max(0, durationMinutes - Math.floor(progressSeconds / 60));

    return (
        <Link 
            href={`/watch/${slug}`}
            className="group relative block bg-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:bg-white/10"
        >
            {/* Thumbnail Area */}
            <div className="relative aspect-video w-full overflow-hidden">
                <Image
                    src={highResImageUrl}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                
                {/* Play Icon on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center text-white shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <span className="material-symbols-outlined text-3xl">play_arrow</span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <span className="text-[10px] text-white/40 font-medium whitespace-nowrap">
                        {remainingMinutes}{tCommon('minutesAbbr')} {t('left')}
                    </span>
                </div>

                {/* Progress Bar Container */}
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    {/* Active Progress */}
                    <div 
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                    />
                </div>
            </div>
        </Link>
    );
}
