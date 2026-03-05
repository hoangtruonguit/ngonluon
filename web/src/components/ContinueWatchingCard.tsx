import Image from 'next/image';

interface ContinueWatchingCardProps {
    title: string;
    timeLeft: string;
    progress: number; // percentage 0-100
    imageUrl: string;
}

export default function ContinueWatchingCard({ title, timeLeft, progress, imageUrl }: ContinueWatchingCardProps) {
    return (
        <div className="group relative bg-surface-dark rounded-xl overflow-hidden cursor-pointer shadow-2xl transition-transform hover:-translate-y-2">
            <div className="aspect-video relative">
                <Image src={imageUrl} alt={title} fill className="object-cover" />
            </div>
            <div className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white truncate">{title}</h3>
                    <span className="text-xs text-white/50">{timeLeft}</span>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
}
