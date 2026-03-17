'use client';

import { useRouter } from '@/i18n/routing';
import React from 'react';

interface BreadcrumbItem {
    label: string;
    href?: string;
    active?: boolean;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
    const router = useRouter();

    return (
        <nav className="flex items-center gap-3 text-white/30 text-xs font-bold uppercase tracking-widest mb-4">
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {item.href ? (
                        <span 
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onClick={() => item.href && router.push(item.href as any)} 
                            className="hover:text-primary cursor-pointer transition-colors"
                        >
                            {item.label}
                        </span>
                    ) : (
                        <span className={item.active ? 'text-white' : ''}>{item.label}</span>
                    )}
                    {index < items.length - 1 && (
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}