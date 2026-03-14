'use client';

interface SearchPaginationProps {
    page: number;
    total: number;
    onPageChange: (page: number) => void;
}

export default function SearchPagination({
    page,
    total,
    onPageChange
}: SearchPaginationProps) {
    if (total <= 10) return null;

    return (
        <div className="mt-16 flex items-center justify-center gap-2">
            <button 
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
                className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 disabled:opacity-20 hover:bg-white/10 hover:text-white transition-all"
            >
                <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {[1, 2, 3].map(p => (
                <button 
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`size-10 rounded-xl text-xs font-bold transition-all ${page === p ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
                >
                    {p}
                </button>
            ))}
            <button 
                onClick={() => onPageChange(page + 1)}
                className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all"
            >
                <span className="material-symbols-outlined">chevron_right</span>
            </button>
        </div>
    );
}
