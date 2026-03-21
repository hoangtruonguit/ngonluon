'use client';

import { use, useMemo } from 'react';
import useSWR from 'swr';
import DiscoveryTemplate from '@/components/search/DiscoveryTemplate';
import { movieService, MovieGenre } from '@/services/movie.service';
import { useTranslations } from 'next-intl';

const fetchGenres = () => movieService.getGenres();

interface GenrePageProps {
    params: Promise<{ slug: string; locale: string }>;
}

export default function GenrePage({ params }: GenrePageProps) {
    const { slug } = use(params);
    const t = useTranslations('Search');

    const { data: genres } = useSWR<MovieGenre[]>('genres', fetchGenres);
    const genre = genres?.find(g => g.slug === slug || g.id.toString() === slug);
    const genreName = genre?.name ?? slug;

    const initialFilters = useMemo(() => ({
        genres: [slug]
    }), [slug]);

    const breadcrumbItems = useMemo(() => [
        { label: t('home'), href: '/' },
        { label: t('genre'), href: '/' },
        { label: genreName, active: true }
    ], [t, genreName]);

    return (
        <DiscoveryTemplate
            baseTitle={t('genreTitle', { name: genreName })}
            hideSearchInTitle={true}
            initialFilters={initialFilters}
            breadcrumbItems={breadcrumbItems}
        />
    );
}
