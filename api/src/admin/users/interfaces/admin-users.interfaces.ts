export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  roles: string[];
  _count: { reviews: number; comments: number; watchHistory: number };
}

export interface AdminUserDetail extends AdminUser {
  _count: {
    reviews: number;
    comments: number;
    watchHistory: number;
    watchlist: number;
  };
}

export interface AdminUserListResponse {
  data: AdminUser[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}
