import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface ContinueWatchingCardProps {
    title: string;
    timeLeft: { hours?: number; minutes?: number };
    progress: number; // percentage 0-100
    imageUrl: string;
}

export default function ContinueWatchingCard({ title, timeLeft, progress, imageUrl }: ContinueWatchingCardProps) {
    const t = useTranslations('Common');

    const formatTimeLeft = () => {
        const parts = [];
        if (timeLeft.hours) {
            parts.push(`${timeLeft.hours}${t('hoursAbbr')}`);
        }
        if (timeLeft.minutes) {
            parts.push(`${timeLeft.minutes}${t('minutesAbbr')}`);
        }
        return t('timeLeft', { time: parts.join(' ') });
    };

    return (
        <div className="group relative bg-surface-dark rounded-xl overflow-hidden cursor-pointer shadow-2xl transition-transform hover:-translate-y-2">
            <div className="aspect-video relative">
                <Image src={imageUrl} alt={title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px" className="object-cover" />
            </div>
            <div className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white truncate">{title}</h3>
                    <span className="text-xs text-white/50">{formatTimeLeft()}</span>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
}
