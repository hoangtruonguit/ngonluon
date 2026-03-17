'use client';

import { use, useEffect, useState } from 'react';
import DiscoveryTemplate from '@/components/search/DiscoveryTemplate';
import { movieService } from '@/services/movie.service';
import { useTranslations } from 'next-intl';

interface GenrePageProps {
    params: Promise<{ slug: string; locale: string }>;
}

export default function GenrePage({ params }: GenrePageProps) {
    const { slug } = use(params);
    const t = useTranslations('Search');
    const [genreName, setGenreName] = useState(slug);

    useEffect(() => {
        movieService.getGenres().then(genres => {
            const genre = genres.find(g => g.slug === slug || g.id.toString() === slug);
            if (genre) {
                setGenreName(genre.name);
            }
        });
    }, [slug]);

    return (
        <DiscoveryTemplate 
            baseTitle={t('genreTitle', { name: genreName })}
            hideSearchInTitle={true}
            initialFilters={{
                genres: [slug]
            }}
            breadcrumbItems={[
                { label: t('home'), href: '/' },
                { label: t('genre'), href: '/' },
                { label: genreName, active: true }
            ]}
        />
    );
}
