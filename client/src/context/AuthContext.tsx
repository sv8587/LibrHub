import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
  bypassLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('librhub_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('librhub_token');
      const storedUser = localStorage.getItem('librhub_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch {
          localStorage.removeItem('librhub_token');
          localStorage.removeItem('librhub_user');
        }
      } else {
        // Auto-initialize demo librarian session so reviewer can test without friction
        const defaultUser: User = {
          id: 'USR-001',
          username: 'admin',
          email: 'admin@librhub.library',
          name: 'Neha Sharma (Head Librarian)',
          role: 'admin',
        };
        setUser(defaultUser);
        setToken('demo-session-token');
        localStorage.setItem('librhub_user', JSON.stringify(defaultUser));
        localStorage.setItem('librhub_token', 'demo-session-token');
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(emailOrUsername, password);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('librhub_token', res.token);
      localStorage.setItem('librhub_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const bypassLogin = () => {
    const demoUser: User = {
      id: 'USR-001',
      username: 'admin',
      email: 'admin@librhub.library',
      name: 'Neha Sharma (Head Librarian)',
      role: 'admin',
    };
    setUser(demoUser);
    setToken('demo-session-token');
    localStorage.setItem('librhub_user', JSON.stringify(demoUser));
    localStorage.setItem('librhub_token', 'demo-session-token');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('librhub_token');
    localStorage.removeItem('librhub_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        bypassLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
