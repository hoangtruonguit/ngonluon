'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { ChangeEvent, useTransition } from 'react';

export default function LanguageSwitcher() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();

    function onSelectChange(event: ChangeEvent<HTMLSelectElement>) {
        const nextLocale = event.target.value;
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    }

    return (
        <select
            defaultValue={locale}
            disabled={isPending}
            onChange={onSelectChange}
            className="bg-transparent text-white text-sm border border-white/20 rounded-md px-2 py-1 outline-none"
        >
            <option value="en" className="text-black">EN</option>
            <option value="vi" className="text-black">VI</option>
        </select>
    );
}
