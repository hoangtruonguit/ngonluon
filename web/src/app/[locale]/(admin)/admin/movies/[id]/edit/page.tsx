'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { adminService, AdminMovie, UpdateMovieData } from '@/services/admin.service';

export default function EditMoviePage() {
    const t = useTranslations('Admin');
    const router = useRouter();
    const params = useParams();
    const movieId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState<UpdateMovieData>({});

    useEffect(() => {
        (async () => {
            try {
                const movie: AdminMovie = await adminService.getMovie(movieId);
                setForm({
                    title: movie.title,
                    description: movie.description || '',
                    posterUrl: movie.posterUrl || '',
                    thumbnailUrl: movie.thumbnailUrl || '',
                    releaseYear: movie.releaseYear || undefined,
                    rating: movie.rating,
                    durationMinutes: movie.durationMinutes || undefined,
                    trailerUrl: movie.trailerUrl || '',
                });
            } catch {
                setError(t('movieNotFound'));
            } finally {
                setLoading(false);
            }
        })();
    }, [movieId, t]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: ['releaseYear', 'rating', 'durationMinutes'].includes(name) ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await adminService.updateMovie(movieId, form);
            router.push('/admin/movies');
        } catch (err: unknown) {
            const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : t('saveError');
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-white/50 flex items-center gap-3 justify-center py-20">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                {t('loading')}
            </div>
        );
    }

    return (
        <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-white mb-8">{t('editMovie')}</h1>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-white/60 text-sm font-semibold mb-2">{t('titleLabel')}</label>
                        <input
                            name="title"
                            value={form.title || ''}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-white/60 text-sm font-semibold mb-2">{t('description')}</label>
                        <textarea
                            name="description"
                            value={form.description || ''}
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-white/60 text-sm font-semibold mb-2">{t('year')}</label>
                        <input
                            name="releaseYear"
                            type="number"
                            value={form.releaseYear || ''}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-white/60 text-sm font-semibold mb-2">{t('ratingLabel')}</label>
                        <input
                            name="rating"
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={form.rating ?? ''}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-white/60 text-sm font-semibold mb-2">{t('duration')}</label>
                        <input
                            name="durationMinutes"
                            type="number"
                            value={form.durationMinutes || ''}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-white/60 text-sm font-semibold mb-2">{t('posterUrl')}</label>
                        <input
                            name="posterUrl"
                            value={form.posterUrl || ''}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-white/60 text-sm font-semibold mb-2">{t('thumbnailUrl')}</label>
                        <input
                            name="thumbnailUrl"
                            value={form.thumbnailUrl || ''}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-white/60 text-sm font-semibold mb-2">{t('trailerUrl')}</label>
                        <input
                            name="trailerUrl"
                            value={form.trailerUrl || ''}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}
                        {saving ? t('saving') : t('save')}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push('/admin/movies')}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
