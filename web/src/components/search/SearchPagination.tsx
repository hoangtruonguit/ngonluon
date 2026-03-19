'use client';

interface SearchPaginationProps {
    page: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function SearchPagination({
    page,
    total,
    totalPages,
    onPageChange
}: SearchPaginationProps) {
    if (total <= 20 || totalPages <= 1) return null;

    // Helper logic for page numbers (showing a few around current)
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, page - 2);
        const end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="mt-16 flex items-center justify-center gap-2">
            <button 
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
                className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 disabled:opacity-20 hover:bg-white/10 hover:text-white transition-all shadow-lg"
            >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            
            {getPageNumbers().map(p => (
                <button 
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`size-10 rounded-xl text-xs font-bold transition-all shadow-lg ${page === p ? 'bg-primary text-secondary' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
                >
                    {p}
                </button>
            ))}
            
            <button 
                disabled={page === totalPages}
                onClick={() => onPageChange(page + 1)}
                className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 disabled:opacity-20 hover:bg-white/10 hover:text-white transition-all shadow-lg"
            >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
        </div>
    );
}
