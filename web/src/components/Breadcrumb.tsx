'use client';

import { useRouter } from 'next/navigation';

interface BreadcrumbProps {
    movieTitle: string;
}

export default function Breadcrumb({ movieTitle }: BreadcrumbProps) {
    const router = useRouter();

    return (
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4 cursor-pointer">
            <span onClick={() => router.push('/')} className="hover:text-primary transition-colors">Home</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="hover:text-primary transition-colors">Movies</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-white truncate">{movieTitle}</span>
        </nav>
    );
}