'use client';

import Image from 'next/image';
import Link from 'next/link';
import { movieService } from '@/services/movie.service';
import { useRouter } from 'next/navigation';
import { useState } from 'react';


interface MovieCardProps {
    title: string;
    rating?: string;
    description: string;
    imageUrl: string;
    showWatchButton?: boolean;
    slug?: string;
    source?: 'local' | 'tmdb';
    onImport?: () => void;
}

export default function MovieCard({ 
    title, 
    rating, 
    description, 
    imageUrl, 
    showWatchButton = false, 
    slug,
    source = 'local',
    onImport
}: MovieCardProps) {
    const highResImageUrl = movieService.getHighResImage(imageUrl);
    const router = useRouter();
    const [isImporting, setIsImporting] = useState(false);

    const handleImportClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onImport) {
            setIsImporting(true);
            onImport();
        }
    };

    const card = (
        <div className="movie-card relative min-w-[200px] lg:min-w-[240px] aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group shadow-2xl flex-shrink-0">
            {/* Source Badge */}
            {source === 'tmdb' && (
                <div className="absolute top-3 right-3 z-10 bg-primary/90 text-secondary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg ring-1 ring-white/20">
                    TMDB
                </div>
            )}

            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                <Image src={highResImageUrl} alt={title} fill sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 250px" className="object-cover" />
            </div>

            <div className={`card-overlay absolute inset-0 bg-black/80 transition-opacity duration-300 flex flex-col justify-end p-6 space-y-3 ${source === 'tmdb' ? 'opacity-100 md:opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                {rating && (
                    <div className="flex items-center gap-2">
                        <span className="text-primary font-black">{rating}</span>
                        <span className="text-white/50 text-xs uppercase font-bold tracking-widest">{source === 'tmdb' ? 'TMDB' : 'IMDb'}</span>
                    </div>
                )}
                <h4 className="text-white font-bold text-xl">{title}</h4>
                <p className="text-white/70 text-xs line-clamp-3">{description}</p>
                
                {source === 'tmdb' ? (
                    <button
                        className={`w-full mt-2 py-2.5 rounded-lg text-secondary text-xs font-black uppercase tracking-widest shadow-xl transition-all ${isImporting ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
                        onClick={handleImportClick}
                        disabled={isImporting}
                    >
                        {isImporting ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-secondary" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Importing...
                            </span>
                        ) : 'Import Movie'}
                    </button>
                ) : (
                    showWatchButton && slug && (
                        <button
                            className="w-full bg-primary py-2 rounded-lg text-white text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/watch/${slug}`);
                            }}
                        >
                            Watch Now
                        </button>
                    )
                )}
            </div>
        </div>
    );

    if (source === 'local' && slug) {
        return <Link href={`/movies/${slug}`}>{card}</Link>;
    }

    return card;
}
