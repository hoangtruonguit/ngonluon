export default function ActionButtons() {
    const actions = [
        { icon: 'favorite', label: 'Add to Favorites' },
        { icon: 'add_box', label: 'Playlist' },
        { icon: 'share', label: 'Share' },
        { icon: 'flag', label: 'Report' },
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