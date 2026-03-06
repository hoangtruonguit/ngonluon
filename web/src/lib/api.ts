const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
    statusCode: number;
    message: string;
    data: T;
    timestamp: string;
}

export interface RegisterData {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    termsAccepted: boolean;
}

export interface RegisterResponse {
    id: string;
    email: string;
    fullName: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw {
                statusCode: response.status,
                message: data.message || 'An error occurred',
                data: data.data || null,
            };
        }

        return data;
    }

    // Auth endpoints
    async register(data: RegisterData): Promise<ApiResponse<RegisterResponse>> {
        return this.request<RegisterResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async login(email: string, password: string) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST',
        });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
