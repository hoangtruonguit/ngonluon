'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { adminService, AdminUser } from '@/services/admin.service';
import RoleEditModal from '@/components/admin/RoleEditModal';

const ROLE_BADGE: Record<string, string> = {
    ADMIN: 'bg-red-500/20 text-red-400',
    USER: 'bg-blue-500/20 text-blue-400',
    VIP: 'bg-yellow-500/20 text-yellow-400',
};

export default function UserManagementPage() {
    const t = useTranslations('Admin');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [saving, setSaving] = useState(false);

    const { data, mutate } = useSWR(
        `admin-users-${page}-${search}-${roleFilter}`,
        () => adminService.getUsers(page, 20, search || undefined, roleFilter || undefined),
    );

    const handleSearch = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPage(1);
        mutate();
    }, [mutate]);

    const handleSaveRoles = useCallback(async (roles: string[]) => {
        if (!editingUser) return;
        setSaving(true);
        try {
            await adminService.updateUserRoles(editingUser.id, roles);
            setEditingUser(null);
            mutate();
        } finally {
            setSaving(false);
        }
    }, [editingUser, mutate]);

    const handleToggleStatus = useCallback(async (user: AdminUser) => {
        const newStatus = !user.isActive;
        const msg = newStatus ? t('confirmUnban') : t('confirmBan');
        if (!confirm(msg)) return;
        await adminService.toggleUserStatus(user.id, newStatus);
        mutate();
    }, [mutate, t]);

    const users = data?.data ?? [];
    const meta = data?.meta;

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('userManagement')}</h1>
            <p className="text-white/50 mb-8">{t('userManagementDesc')}</p>

            {/* Search & Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30">search</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('searchUsers')}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                        />
                    </div>
                </form>
                <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary/50"
                >
                    <option value="">{t('allRoles')}</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="USER">USER</option>
                    <option value="VIP">VIP</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-surface-dark border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left text-white/50 text-xs font-semibold uppercase px-5 py-3">User</th>
                                <th className="text-left text-white/50 text-xs font-semibold uppercase px-5 py-3">{t('email')}</th>
                                <th className="text-left text-white/50 text-xs font-semibold uppercase px-5 py-3">{t('roles')}</th>
                                <th className="text-left text-white/50 text-xs font-semibold uppercase px-5 py-3">{t('status')}</th>
                                <th className="text-left text-white/50 text-xs font-semibold uppercase px-5 py-3">{t('joined')}</th>
                                <th className="text-right text-white/50 text-xs font-semibold uppercase px-5 py-3">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                    <span className="text-primary text-xs font-bold">
                                                        {(user.fullName ?? user.email).charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <span className="text-white text-sm font-medium">{user.fullName ?? '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-white/60 text-sm">{user.email}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex gap-1">
                                            {user.roles.map((role) => (
                                                <span key={role} className={`px-2 py-0.5 rounded-md text-xs font-semibold ${ROLE_BADGE[role] ?? 'bg-white/10 text-white/60'}`}>
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                                            user.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                            {user.isActive ? t('active') : t('banned')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-white/40 text-sm" suppressHydrationWarning>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
                                                title={t('editRoles')}
                                            >
                                                <span className="material-symbols-outlined text-lg">shield_person</span>
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className={`p-2 rounded-lg transition-all ${
                                                    user.isActive
                                                        ? 'text-white/40 hover:text-red-400 hover:bg-red-500/10'
                                                        : 'text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10'
                                                }`}
                                                title={user.isActive ? t('banUser') : t('unbanUser')}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {user.isActive ? 'block' : 'check_circle'}
                                                </span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-white/30 text-sm">
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
                        <span className="text-white/40 text-sm">
                            {t('pageLabel')} {meta.page} / {meta.totalPages} ({meta.total} users)
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 rounded-lg text-sm text-white/60 hover:bg-white/5 disabled:opacity-30 transition-all"
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                                disabled={page >= meta.totalPages}
                                className="px-3 py-1.5 rounded-lg text-sm text-white/60 hover:bg-white/5 disabled:opacity-30 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Role Edit Modal */}
            {editingUser && (
                <RoleEditModal
                    userName={editingUser.fullName ?? editingUser.email}
                    currentRoles={editingUser.roles}
                    onSave={handleSaveRoles}
                    onClose={() => setEditingUser(null)}
                    saving={saving}
                />
            )}
        </div>
    );
}
