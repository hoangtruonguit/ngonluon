/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import DiscoveryTemplate from '@/components/search/DiscoveryTemplate';
import { getTranslations } from 'next-intl/server';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const tSearch = await getTranslations('Search');
    const tHome = await getTranslations('Home');
    const tHeader = await getTranslations('Header');

    const CATEGORY_TITLES: Record<string, string> = {
        'movies': tHeader('movies'),
        'tv-shows': tHeader('tvShows'),
        'trending': tHome('trending'),
        'new-releases': tHome('newReleases'),
        'now-playing': tHome('nowPlaying')
    };

    const CATEGORY_TYPES: Record<string, string> = {
        'movies': 'MOVIE',
        'tv-shows': 'SERIES',
    };

    const title = CATEGORY_TITLES[slug] || slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    const type = CATEGORY_TYPES[slug];
    
    const initialFilters: any = { type };
    if (slug === 'new-releases') initialFilters.sortBy = 'newest';
    if (slug === 'trending' || slug === 'now-playing') initialFilters.sortBy = 'popularity';
    if (slug === 'now-playing') initialFilters.yearFrom = '2024';

    const breadcrumbItems = [
        { label: tSearch('home'), href: '/' },
        { label: tSearch('results'), href: '/' },
        { label: title, active: true }
    ];

    return (
        <DiscoveryTemplate
            baseTitle={title}
            breadcrumbItems={breadcrumbItems}
            initialFilters={initialFilters}
        />
    );
}
