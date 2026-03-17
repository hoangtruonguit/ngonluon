'use client';

import Link from 'next/link';
import ContinueWatchingCard from '@/components/ContinueWatchingCard';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';

export default function ContinueWatchingSection() {
    const { isLoggedIn, isLoading } = useAuth();
    const t = useTranslations('Home');

    if (isLoading || !isLoggedIn) {
        return null;
    }

    return (
        <section className="px-6 lg:px-24 max-w-[1440px] mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-2xl font-bold tracking-tight">{t('continueWatching')}</h2>
                <Link className="text-primary text-sm font-bold hover:underline flex items-center gap-1" href="#">
                    {t('viewAll')} <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ContinueWatchingCard
                    title="Interstellar"
                    timeLeft={{ minutes: 45 }}
                    progress={70}
                    imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuB2m5Rh1FLP1HGOF8XoltCzDDa5xqdcIuDc3mdn-6oxC0pOseE_TcYiY7HPqGUOZ7wzG1BzXh7q0xLKTdGw8Bd-_G0g5Vv95iGE-Cqrb4gVabvaKWPBwDh0ruTTG5xS2I9p3OIZB6BDhkrm2XxeaagSJfpDttAYWiXLiJXFcTpWtjJLCZhtiYl692ExamhDPAD0L5NJXHVWYQYKH2ECh_I8OkjzUatzfKl390DapPpWM4EF-Ml7L0mppqufangDQ0igCV5aESg56fg"
                />
                <ContinueWatchingCard
                    title="The Batman"
                    timeLeft={{ hours: 1, minutes: 10 }}
                    progress={30}
                    imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuDgKQ1Mh6b_C8ikcTwWSmtdAz9_AXnDftNA8lwfI545hsjIlAWSgGKa6uxXPcNqfQkLSWXnRo9vVOje3C5C-xJ0YG_g1TMuc1YPyP3613Jtep93egYN2Z6tspWJQVpg4W-0GkZOFcb17o0QtqFWVbFfnF7aUq7TGyNqMfDGtD8RoFMPd4k9h2Ri--eciRy-SUS1d30Or4IzShcijzkAJ1aFvMJbw39YgiPINcAbr7cMpCV7zacYcIwKNWi53w_eudGTdSLES7GeUCU"
                />
                <ContinueWatchingCard
                    title="Inception"
                    timeLeft={{ minutes: 20 }}
                    progress={85}
                    imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuAsNEwXo6UcuKqS9wmW_lFKJhKyHWH2lUzxRzS5HfW_DYdeWg_mh85lmuca3sqgEL7EfJSA9i2Tspmf5IBN5uVZl6ljpiFxwQZ-1lW8jP6RaffhBCJpZ4jobyaAi9zsNxx-3zIxYjcA_qMZcf2-KnJmtiCyUfA-zFAwzHOQIgg-BfsLg5TleCbmKFJEqoM_9PS-lcvz_iUoGGVzttFGX8Lz2Xp575xCwoOEB_MjoP6sjiYf4tLFkWf6At095nIi6U2iZm1kEpyGil0"
                />
                <ContinueWatchingCard
                    title="The Matrix"
                    timeLeft={{ minutes: 55 }}
                    progress={45}
                    imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuAwVEpzYUuOJ39tsHX1YhIi1EBh8mtfSvaSiX61IS9MMDkOEKHFOMsRnTr3OuyFPVb3Pem7H6bRJGdvaHrYNn_gXyIRbCOEbUoRgUbV6lQBjdukCqG82VP5lNnEDNyP9pp38ttV1iWujP4nIV_MwOEUtqaF1LojfLhX0MH-gxzmSzF5-O_N5-jBvw9aTv7XCm0uILLWxbvXWtSQHD41wYPZT3O5LpqBuP4iOPL_TdH7HEjBCi26awT1nv278psVGpWOV8Cd-iZmEEs"
                />
            </div>
        </section>
    );
}
