const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const REQUEST_TIMEOUT = 15000; // 15 seconds timeout

// Token management
const getToken = (): string | null => localStorage.getItem('token');
const setToken = (token: string): void => localStorage.setItem('token', token);
const removeToken = (): void => localStorage.removeItem('token');

// Fetch with timeout wrapper
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = REQUEST_TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Helper for making authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}${url}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            removeToken();
            window.location.href = '/login';
        }

        return response;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw error;
    }
}

// Auth API
export const authApi = {
    async login(email: string, password: string) {
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Login failed' }));
                throw new Error(error.detail || 'Login failed');
            }

            const data = await response.json();
            setToken(data.access_token);
            return data;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Login request timed out. Please try again.');
            }
            throw error;
        }
    },

    async register(name: string, email: string, password: string, role?: string) {
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
                throw new Error(error.detail || 'Registration failed');
            }

            const data = await response.json();
            setToken(data.access_token);
            return data;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Registration request timed out. Please try again.');
            }
            throw error;
        }
    },

    logout() {
        removeToken();
    },

    isAuthenticated(): boolean {
        return !!getToken();
    },

    async forgotPassword(email: string) {
        const response = await fetchWithTimeout(`${API_BASE_URL}/auth/forgot-password?email=${encodeURIComponent(email)}`, {
            method: 'POST',
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to send reset email' }));
            throw new Error(error.detail || 'Failed to send reset email');
        }
        return response.json();
    },

    async resetPassword(token: string, newPassword: string) {
        const response = await fetchWithTimeout(`${API_BASE_URL}/auth/reset-password?token=${encodeURIComponent(token)}&new_password=${encodeURIComponent(newPassword)}`, {
            method: 'POST',
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to reset password' }));
            throw new Error(error.detail || 'Failed to reset password');
        }
        return response.json();
    }
};

// Users API
export const usersApi = {
    async getCurrentUser() {
        const response = await fetchWithAuth('/users/me');
        if (!response.ok) throw new Error('Failed to get user');
        return response.json();
    },

    async getAll() {
        const response = await fetchWithAuth('/users/all');
        if (!response.ok) throw new Error('Failed to get users');
        return response.json();
    },

    async changePassword(currentPassword: string, newPassword: string) {
        const response = await fetchWithAuth('/users/change-password', {
            method: 'POST',
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
            }),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to change password' }));
            throw new Error(error.detail || 'Failed to change password');
        }
        return response.json();
    }
};

// Clients API
export const clientsApi = {
    async getAll() {
        const response = await fetchWithAuth('/clients');
        if (!response.ok) throw new Error('Failed to get clients');
        const data = await response.json();
        // Convert date strings to Date objects
        return data.map((c: any) => ({
            ...c,
            lastAccessed: new Date(c.lastAccessed),
            createdAt: new Date(c.createdAt),
        }));
    },

    async getById(id: string) {
        const response = await fetchWithAuth(`/clients/${id}`);
        if (!response.ok) throw new Error('Failed to get client');
        const data = await response.json();
        return {
            ...data,
            lastAccessed: new Date(data.lastAccessed),
            createdAt: new Date(data.createdAt),
        };
    },

    async create(client: { name: string; description?: string; initials: string; color: string }) {
        const response = await fetchWithAuth('/clients', {
            method: 'POST',
            body: JSON.stringify(client),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to create client' }));
            throw new Error(error.detail || 'Failed to create client');
        }
        const data = await response.json();
        return {
            ...data,
            lastAccessed: new Date(data.lastAccessed),
            createdAt: new Date(data.createdAt),
        };
    },

    async update(id: string, client: Partial<{ name: string; description: string; initials: string; color: string }>) {
        const response = await fetchWithAuth(`/clients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(client),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to update client' }));
            throw new Error(error.detail || 'Failed to update client');
        }
        const data = await response.json();
        return {
            ...data,
            lastAccessed: new Date(data.lastAccessed),
            createdAt: new Date(data.createdAt),
        };
    },

    async updateLastAccessed(id: string) {
        try {
            const response = await fetchWithAuth(`/clients/${id}/access`, {
                method: 'PUT',
            });
            if (!response.ok) {
                console.warn('Failed to update last accessed');
                return { message: 'skipped' }; // Non-critical, don't throw
            }
            return response.json();
        } catch (error) {
            console.warn('Failed to update last accessed:', error);
            return { message: 'skipped' }; // Non-critical, don't throw
        }
    },

    async delete(id: string) {
        const response = await fetchWithAuth(`/clients/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to delete client' }));
            throw new Error(error.detail || 'Failed to delete client');
        }
    }
};

// Credentials API
export const credentialsApi = {
    async getAll() {
        const response = await fetchWithAuth('/credentials');
        if (!response.ok) throw new Error('Failed to get credentials');
        const data = await response.json();
        return data.map((c: any) => ({
            ...c,
            lastUpdated: new Date(c.lastUpdated),
            createdAt: new Date(c.createdAt),
        }));
    },

    async getByClientId(clientId: string) {
        const response = await fetchWithAuth(`/credentials/client/${clientId}`);
        if (!response.ok) throw new Error('Failed to get credentials');
        const data = await response.json();
        return data.map((c: any) => ({
            ...c,
            lastUpdated: new Date(c.lastUpdated),
            createdAt: new Date(c.createdAt),
        }));
    },

    async create(credential: {
        clientId: string;
        name: string;
        environment: string;
        serviceType: string;
        username: string;
        password: string;
        url?: string;
        notes?: string;
        tags: string[];
        allowedUserIds?: string[];
    }) {
        const response = await fetchWithAuth('/credentials', {
            method: 'POST',
            body: JSON.stringify(credential),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to create credential' }));
            throw new Error(error.detail || 'Failed to create credential');
        }
        const data = await response.json();
        return {
            ...data,
            lastUpdated: new Date(data.lastUpdated),
            createdAt: new Date(data.createdAt),
        };
    },

    async update(id: string, credential: Partial<{
        name: string;
        environment: string;
        serviceType: string;
        username: string;
        password: string;
        url: string;
        notes: string;
        tags: string[];
        allowedUserIds: string[];
    }>) {
        const response = await fetchWithAuth(`/credentials/${id}`, {
            method: 'PUT',
            body: JSON.stringify(credential),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to update credential' }));
            throw new Error(error.detail || 'Failed to update credential');
        }
        const data = await response.json();
        return {
            ...data,
            lastUpdated: new Date(data.lastUpdated),
            createdAt: new Date(data.createdAt),
        };
    },

    async delete(id: string) {
        const response = await fetchWithAuth(`/credentials/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to delete credential' }));
            throw new Error(error.detail || 'Failed to delete credential');
        }
    }
};
