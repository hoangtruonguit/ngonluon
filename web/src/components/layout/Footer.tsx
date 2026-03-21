import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Footer() {
    const t = useTranslations('Footer');

    return (
        <footer className="bg-surface-dark/50 border-t border-white/5 py-12 px-6 lg:px-24">
            <div className="max-w-[1440px] mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="space-y-4">
                        <h5 className="text-white font-bold uppercase tracking-widest text-xs">{t('platform')}</h5>
                        <ul className="space-y-2 text-white/50 text-sm font-medium">
                            <li><Link className="hover:text-primary" href="#">{t('downloadApp')}</Link></li>
                            <li><Link className="hover:text-primary" href="#">{t('tvDevices')}</Link></li>
                            <li><Link className="hover:text-primary" href="#">{t('subscriptionPlans')}</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h5 className="text-white font-bold uppercase tracking-widest text-xs">{t('help')}</h5>
                        <ul className="space-y-2 text-white/50 text-sm font-medium">
                            <li><Link className="hover:text-primary" href="#">{t('account')}</Link></li>
                            <li><Link className="hover:text-primary" href="#">{t('helpCenter')}</Link></li>
                            <li><Link className="hover:text-primary" href="#">{t('contactUs')}</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h5 className="text-white font-bold uppercase tracking-widest text-xs">{t('legal')}</h5>
                        <ul className="space-y-2 text-white/50 text-sm font-medium">
                            <li><Link className="hover:text-primary" href="#">{t('privacyPolicy')}</Link></li>
                            <li><Link className="hover:text-primary" href="#">{t('termsOfUse')}</Link></li>
                            <li><Link className="hover:text-primary" href="#">{t('cookiePrefs')}</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h5 className="text-white font-bold uppercase tracking-widest text-xs">{t('connect')}</h5>
                        <div className="flex gap-4">
                            <span className="material-symbols-outlined text-white/50 hover:text-primary cursor-pointer">social_leaderboard</span>
                            <span className="material-symbols-outlined text-white/50 hover:text-primary cursor-pointer">groups</span>
                            <span className="material-symbols-outlined text-white/50 hover:text-primary cursor-pointer">rss_feed</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4">
                    <div className="flex items-center gap-2 text-primary opacity-50">
                        <span className="material-symbols-outlined text-2xl">movie_filter</span>
                        <h2 className="text-white text-lg font-bold">Trailer</h2>
                    </div>
                    <p className="text-white/30 text-xs">© 2024 Trailer Entertainment Inc. {t('rightsReserved')}</p>
                </div>
            </div>
        </footer>
    );
}
