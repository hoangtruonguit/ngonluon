import { useTranslations } from 'next-intl';

export default function ActionButtons() {
    const t = useTranslations('Watch');
    const actions = [
        { icon: 'favorite', label: t('addToFavorites') },
        { icon: 'add_box', label: t('playlist') },
        { icon: 'share', label: t('share') },
        { icon: 'flag', label: t('report') },
    ];

    return (
        <div className="flex flex-wrap items-center gap-3 mt-4 py-4 border-b border-white/5">
            {actions.map((action) => (
                <button
                    key={action.icon}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-white/10 rounded-lg text-sm transition-colors text-white"
                >
                    <span className="material-symbols-outlined text-sm">{action.icon}</span>
                    {action.label}
                </button>
            ))}
        </div>
    );
}