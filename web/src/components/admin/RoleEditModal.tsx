'use client';

import { useState } from 'react';

const ALL_ROLES = ['ADMIN', 'USER'] as const;

const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
    USER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

interface RoleEditModalProps {
    userName: string;
    currentRoles: string[];
    onSave: (roles: string[]) => void;
    onClose: () => void;
    saving?: boolean;
}

export default function RoleEditModal({ userName, currentRoles, onSave, onClose, saving }: RoleEditModalProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set(currentRoles));

    const toggle = (role: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(role)) {
                next.delete(role);
            } else {
                next.add(role);
            }
            return next;
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-surface-dark border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-white font-bold text-lg mb-1">Edit Roles</h3>
                <p className="text-white/50 text-sm mb-5">{userName}</p>

                <div className="space-y-2 mb-6">
                    {ALL_ROLES.map((role) => (
                        <button
                            key={role}
                            onClick={() => toggle(role)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                                selected.has(role)
                                    ? ROLE_COLORS[role]
                                    : 'border-white/10 text-white/40 hover:border-white/20'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-lg ${selected.has(role) ? '' : 'opacity-30'}`}>
                                {selected.has(role) ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className="font-semibold text-sm">{role}</span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(Array.from(selected))}
                        disabled={saving || selected.size === 0}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
