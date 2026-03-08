import Image from 'next/image';

interface MovieCardProps {
    title: string;
    rating?: string;
    description: string;
    imageUrl: string;
    showWatchButton?: boolean;
}

export default function MovieCard({ title, rating, description, imageUrl, showWatchButton = false }: MovieCardProps) {
    return (
        <div className="movie-card relative min-w-[200px] lg:min-w-[240px] aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group shadow-2xl flex-shrink-0">
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                <Image src={imageUrl} alt={title} fill sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 250px" className="object-cover" />
            </div>
            <div className="card-overlay absolute inset-0 bg-black/80 opacity-0 transition-opacity duration-300 flex flex-col justify-end p-6 space-y-3">
                {rating && (
                    <div className="flex items-center gap-2">
                        <span className="text-primary font-black">{rating}</span>
                        <span className="text-white/50 text-xs uppercase font-bold tracking-widest">IMDb</span>
                    </div>
                )}
                <h4 className="text-white font-bold text-xl">{title}</h4>
                <p className="text-white/70 text-xs line-clamp-3">{description}</p>
                {showWatchButton && (
                    <button className="w-full bg-primary py-2 rounded-lg text-white text-xs font-bold uppercase tracking-widest mt-2">
                        Watch Now
                    </button>
                )}
            </div>
        </div>
    );
}
