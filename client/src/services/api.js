import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const bookAPI = {
    getAll: (params) => api.get('/books', { params }),
    search: (query) => api.get(`/books/search?q=${encodeURIComponent(query)}`),
    getPopular: (limit) => api.get(`/books/popular?limit=${limit || 10}`),
    getNewArrivals: (limit) => api.get(`/books/new-arrivals?limit=${limit || 10}`),
    getAvailable: () => api.get('/books/available'),
    getById: (id) => api.get(`/books/${id}`),
    getSimilar: (id, limit) => api.get(`/books/${id}/similar?limit=${limit || 5}`),
    create: (data) => api.post('/books', data),
    update: (id, data) => api.put(`/books/${id}`, data),
    delete: (id) => api.delete(`/books/${id}`),
    borrow: (bookId) => api.post(`/books/${bookId}/borrow`),
};

export const wishlistAPI = {
    getAll: () => api.get('/wishlist'),
    add: (bookId) => api.post(`/wishlist/${bookId}`),
    remove: (bookId) => api.delete(`/wishlist/${bookId}`),
};

export const loanAPI = {
    getByUser: (userId) => api.get(`/users/${userId}/loans`),
    getActiveByUser: (userId) => api.get(`/users/${userId}/loans/active`),
    return: (loanId) => api.post(`/loans/${loanId}/return`),
    extend: (loanId, days) => api.post(`/loans/${loanId}/extend`, { days }),
    getAllActive: () => api.get('/loans/active'),
    getOverdue: () => api.get('/loans/overdue'),
    getStats: () => api.get('/loans/stats'),
};

export const categoryAPI = {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

export const userAPI = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    changePassword: (id, data) => api.post(`/users/${id}/password`, data),
    resetPassword: (id) => api.post(`/users/${id}/reset-password`),
};

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
};

export default api;