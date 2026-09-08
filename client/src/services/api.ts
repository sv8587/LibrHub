import axios from 'axios';
import { Book, Transaction, DashboardData, User } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('librhub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Books API
export const bookApi = {
  getAll: async (params: {
    search?: string;
    category?: string;
    availability?: string;
    author?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const res = await api.get<{
      success: boolean;
      books: Book[];
      pagination: { total: number; page: number; limit: number; pages: number };
    }>('/books', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; book: Book }>(`/books/${id}`);
    return res.data.book;
  },

  create: async (data: Partial<Book>) => {
    const res = await api.post<{ success: boolean; message: string; book: Book }>('/books', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Book>) => {
    const res = await api.put<{ success: boolean; message: string; book: Book }>(`/books/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/books/${id}`);
    return res.data;
  },

  getQR: async (id: string) => {
    const res = await api.get<{
      success: boolean;
      bookId: string;
      qrDataUrl: string;
      payload: string;
      bookTitle?: string;
      bookAuthor?: string;
    }>(`/books/${id}/qr`);
    return res.data;
  },

  getCategories: async () => {
    const res = await api.get<{ success: boolean; categories: string[] }>('/books/categories/list');
    return res.data.categories;
  },
};

// Transactions API
export const transactionApi = {
  issue: async (data: {
    bookId: string;
    borrowerName: string;
    borrowerId: string;
    dueDate: string;
    issueDate?: string;
  }) => {
    const res = await api.post<{ success: boolean; message: string; transaction: Transaction }>(
      '/transactions/issue',
      data
    );
    return res.data;
  },

  returnBook: async (data: { bookId: string; borrowerId?: string; transactionId?: string }) => {
    const res = await api.post<{ success: boolean; message: string; transaction: Transaction }>(
      '/transactions/return',
      data
    );
    return res.data;
  },

  getAll: async (params: {
    search?: string;
    status?: string;
    category?: string;
    borrower?: string;
    book?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const res = await api.get<{
      success: boolean;
      transactions: Transaction[];
      pagination: { total: number; page: number; limit: number; pages: number };
    }>('/transactions', { params });
    return res.data;
  },

  getActiveByBook: async (bookId: string) => {
    const res = await api.get<{
      success: boolean;
      activeTransaction: Transaction | null;
      isIssued: boolean;
    }>(`/transactions/active/${bookId}`);
    return res.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const res = await api.get<{
      success: boolean;
      data: DashboardData;
      database: { isConnected: boolean; mode: string; readyState: number };
    }>('/dashboard/stats');
    return res.data;
  },
};

// Reports API
export const reportApi = {
  downloadCsv: async () => {
    const res = await api.get('/reports/transactions/csv', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `librhub-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  downloadExcel: async () => {
    const res = await api.get('/reports/transactions/excel', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(
      new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    );
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `librhub-transactions-${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// AI Assistant API
export const aiApi = {
  chat: async (question: string) => {
    const res = await api.post<{
      success: boolean;
      answer: string;
      confidence: 'ai' | 'heuristic';
      sources?: any;
    }>('/ai/chat', { question });
    return res.data;
  },
};

// Auth API
export const authApi = {
  login: async (emailOrUsername: string, password: string) => {
    const res = await api.post<{
      success: boolean;
      message: string;
      token: string;
      user: User;
    }>('/auth/login', { emailOrUsername, password });
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get<{ success: boolean; user: User }>('/auth/me');
    return res.data.user;
  },
};

export default api;
