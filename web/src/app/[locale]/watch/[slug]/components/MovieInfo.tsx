// components/MovieInfo.tsx
import { MovieDetail } from '@/services/movie.service';

interface MovieInfoProps {
    movie: MovieDetail;
}

export default function MovieInfo({ movie }: MovieInfoProps) {
    return (
        <div className="mt-8 flex flex-col md:flex-row gap-6">
            <div className="shrink-0 hidden md:block">
                <img
                    alt="Poster"
                    className="w-40 h-60 object-cover rounded-lg border border-white/10 shadow-lg"
                    src={movie.posterUrl || 'https://placehold.co/400x600/1a1a1a/FFF?text=No+Poster'}
                />
            </div>
            <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{movie.title}</h1>
                        <p className="text-xl text-primary font-medium">
                            {movie.genres?.[0] ? `Top ${movie.genres[0]} Movie` : 'Trailer Original'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-center bg-surface-dark px-4 py-2 rounded-lg border border-white/5">
                            <p className="text-xs text-gray-400 uppercase">Rating</p>
                            <div className="flex items-center justify-center gap-1 text-primary">
                                <span className="material-symbols-outlined text-sm fill">star</span>
                                <span className="font-bold">{movie.rating}</span>
                            </div>
                        </div>
                        <button className="bg-primary text-secondary font-bold px-6 py-3 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20">
                            Rate Now
                        </button>
                    </div>
                </div>
                <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="px-2 py-0.5 bg-surface-dark text-xs rounded border border-white/10 text-gray-300">
                        {movie.releaseYear || new Date().getFullYear()}
                    </span>
                    {movie.genres?.map((genre) => (
                        <span key={genre} className="px-2 py-0.5 bg-surface-dark text-xs rounded border border-white/10 text-gray-300">{genre}</span>
                    ))}
                    <span className="px-2 py-0.5 bg-surface-dark text-xs rounded border border-white/10 text-gray-300">
                        {movie.durationMinutes} min
                    </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">
                    {movie.description || 'No description available.'}
                </p>
            </div>
        </div>
    );
}