'use client';

import DiscoveryTemplate from '@/components/search/DiscoveryTemplate';
import { useTranslations } from 'next-intl';

export default function SearchPage() {
    const t = useTranslations('Search');
    return (
        <DiscoveryTemplate 
            baseTitle={t('discoverContent')}
            breadcrumbItems={[
                { label: t('home'), href: '/' },
                { label: t('search'), href: '/search' },
                { label: t('results'), active: true }
            ]}
        />
    );
}
