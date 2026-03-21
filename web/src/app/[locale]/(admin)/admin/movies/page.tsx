'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { adminService, AdminMovie } from '@/services/admin.service';

export default function AdminMoviesPage() {
    const t = useTranslations('Admin');
    const [movies, setMovies] = useState<AdminMovie[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchMovies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getMovies(page, 20);
            setMovies(res.data);
        } catch (err) {
            console.error('Failed to fetch movies', err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchMovies();
    }, [fetchMovies]);

    const handleDelete = async (movie: AdminMovie) => {
        if (!confirm(`${t('confirmDelete')} "${movie.title}"?`)) return;
        setDeleting(movie.id);
        try {
            await adminService.deleteMovie(movie.id);
            setMovies((prev) => prev.filter((m) => m.id !== movie.id));
        } catch (err) {
            console.error('Failed to delete movie', err);
            alert(t('deleteError'));
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{t('movieManagement')}</h1>
                    <p className="text-white/50 text-sm">{t('movieManagementDesc')}</p>
                </div>
                <Link
                    href="/admin/movies/create"
                    className="bg-primary hover:bg-primary/80 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    {t('addMovie')}
                </Link>
            </div>

            {loading ? (
                <div className="text-white/50 flex items-center gap-3 justify-center py-20">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    {t('loading')}
                </div>
            ) : (
                <>
                    <div className="bg-surface-dark border border-white/10 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                                    <th className="text-left px-6 py-4">{t('poster')}</th>
                                    <th className="text-left px-6 py-4">{t('titleLabel')}</th>
                                    <th className="text-left px-6 py-4">{t('type')}</th>
                                    <th className="text-left px-6 py-4">{t('year')}</th>
                                    <th className="text-left px-6 py-4">{t('ratingLabel')}</th>
                                    <th className="text-right px-6 py-4">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movies.map((movie) => (
                                    <tr key={movie.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="w-12 h-16 rounded-lg overflow-hidden bg-white/10 relative">
                                                {movie.posterUrl ? (
                                                    <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" sizes="48px" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-white/20">image</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <p className="text-white font-semibold text-sm">{movie.title}</p>
                                            <p className="text-white/40 text-xs truncate max-w-xs">{movie.slug}</p>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${movie.type === 'MOVIE' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                {movie.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-white/60 text-sm">{movie.releaseYear || '—'}</td>
                                        <td className="px-6 py-3">
                                            <span className="text-yellow-400 text-sm font-semibold">{movie.rating?.toFixed(1) || '—'}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2 justify-end">
                                                <Link
                                                    href={`/admin/movies/${movie.id}/edit`}
                                                    className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                                                    title={t('edit')}
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(movie)}
                                                    disabled={deleting === movie.id}
                                                    className="p-2 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-all disabled:opacity-50"
                                                    title={t('delete')}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {deleting === movie.id ? 'progress_activity' : 'delete'}
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {movies.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20 text-white/40">
                                            {t('noMovies')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-center gap-4 mt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        <span className="text-white/50 text-sm">{t('pageLabel')} {page}</span>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={movies.length < 20}
                            className="px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
