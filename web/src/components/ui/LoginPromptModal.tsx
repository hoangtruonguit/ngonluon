'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface LoginPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}

export default function LoginPromptModal({
    isOpen,
    onClose,
    title,
    message,
}: LoginPromptModalProps) {
    const router = useRouter();
    const t = useTranslations('LoginPrompt');

    const displayTitle = title || t('title');
    const displayMessage = message || t('message');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-secondary/80 border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center text-center space-y-6">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-4xl">lock</span>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-white">{displayTitle}</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            {displayMessage}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full pt-2">
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full bg-primary py-3 rounded-xl text-secondary font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                        >
                            {t('signInNow')}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full bg-white/5 py-3 rounded-xl text-white font-medium hover:bg-white/10 transition-all active:scale-95"
                        >
                            {t('maybeLater')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
