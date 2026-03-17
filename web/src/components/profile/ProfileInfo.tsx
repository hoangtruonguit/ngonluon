'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { UserResponseDto } from '@/lib/api';

interface ProfileInfoProps {
    user: UserResponseDto | null;
    onUpdate: (data: { fullName: string; avatarUrl?: string }) => Promise<void>;
    isUpdating: boolean;
    message: { type: 'success' | 'error', text: string } | null;
}

export default function ProfileInfo({ user, onUpdate, isUpdating, message }: ProfileInfoProps) {
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
    const t = useTranslations('Profile');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate({ fullName, avatarUrl });
    };

    return (
        <div className="relative group">
            {/* Background Decoration */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative glass p-8 md:p-12 rounded-[2.5rem] border border-white/10 w-full overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-center">
                    {/* Left side: Avatar & Basic Info */}
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left shrink-0">
                        <div className="size-40 rounded-full overflow-hidden border-2 border-primary/30 mb-6 relative group/avatar cursor-pointer shadow-2xl ring-8 ring-white/5">
                            <Image
                                src={avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuD1Lf8ou0dErc0m7he9KunMHpoZUwHkhj8ivVp9cRwQ4mirIRJgnx_vIeGEnUtTLkYCKvlmYkFdb2joykQ0oV7gR_3PFj34pGk9-K3KR0IWd52SclJqQ9EzVsau7YEmrMYfR6oFnDaoAegwzxIQ7cw49DPaNUPO3vWht8VRkGTkWgbMydPRlrPZIZcJY1DQxmFRuicd6Cxv-h_tnrMtsx_yTNXQuwh625X2vYyrvMahidyo0JG6YSCm5kBK7QkI8HS24eOXJgXYPEU"}
                                alt="User avatar"
                                fill
                                className="object-cover group-hover/avatar:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300">
                                <span className="material-symbols-outlined text-white text-3xl">camera_alt</span>
                            </div>
                        </div>
                        <h3 className="text-3xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
                            {user?.fullName || t('userName')}
                        </h3>
                        <p className="text-primary font-medium text-lg mb-1">{user?.email}</p>
                        <p className="text-white/40 text-sm uppercase tracking-widest font-bold">{t('premiumMember')}</p>
                    </div>

                    {/* Right side: Form Items */}
                    <div className="flex-1 w-full lg:border-l lg:border-white/10 lg:pl-12">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-[0.2em] text-white/40 ml-1">{t('fullNameLabel')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary focus:bg-white/10 focus:border-transparent outline-none transition-all placeholder:text-white/20 text-white font-medium"
                                        placeholder={t('fullNamePlaceholder')}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-[0.2em] text-white/40 ml-1">{t('avatarUrlLabel')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary focus:bg-white/10 focus:border-transparent outline-none transition-all placeholder:text-white/20 text-white font-medium"
                                        placeholder={t('avatarUrlPlaceholder')}
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                    />
                                </div>
                            </div>

                            {message && (
                                <div className={`p-5 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    <span className="material-symbols-outlined text-xl">
                                        {message.type === 'success' ? 'check_circle' : 'error'}
                                    </span>
                                    {message.text}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="w-full md:w-auto min-w-[200px] bg-primary hover:bg-primary/90 text-secondary px-8 py-4 rounded-2xl font-black transition-all shadow-2xl shadow-primary/40 disabled:opacity-50 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isUpdating ? (
                                        <div className="size-6 border-3 border-secondary/30 border-t-secondary rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined font-bold">save</span>
                                            {t('updateButton')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
