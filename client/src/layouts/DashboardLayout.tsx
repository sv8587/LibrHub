import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  QrCode,
  ArrowLeftRight,
  History,
  FileSpreadsheet,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Database,
  Library,
  RefreshCw,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BookModal } from '../components/BookModal';
import { IssueModal } from '../components/IssueModal';
import { ReturnModal } from '../components/ReturnModal';
import { AIAssistantDrawer } from '../components/AIAssistantDrawer';
import { bookApi, dashboardApi } from '../services/api';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Modals state
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // DB status
  const [dbInfo, setDbInfo] = useState<{ isConnected: boolean; mode: string }>({
    isConnected: false,
    mode: 'in-memory',
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('librhub-theme');
    return stored === 'dark' ? 'dark' : 'light';
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('librhub-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const next = (event as CustomEvent<'light' | 'dark'>).detail;
      if (next === 'light' || next === 'dark') setTheme(next);
    };
    window.addEventListener('librhub-theme-change', handleThemeChange);
    return () => window.removeEventListener('librhub-theme-change', handleThemeChange);
  }, []);

  useEffect(() => {
    bookApi.getCategories().then((cats) => setCategories(cats)).catch(() => {});
    dashboardApi
      .getStats()
      .then((res) => {
        if (res.database) {
          setDbInfo({
            isConnected: res.database.isConnected,
            mode: res.database.mode,
          });
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Books Catalogue', path: '/books', icon: BookOpen },
    { name: 'QR Scanner', path: '/scan', icon: QrCode },
    { name: 'Issue / Return', path: '/issue-return', icon: ArrowLeftRight },
    { name: 'Transactions', path: '/transactions', icon: History },
    { name: 'Reports & Export', path: '/reports', icon: FileSpreadsheet },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const [cats, stats] = await Promise.all([bookApi.getCategories(), dashboardApi.getStats()]);
      setCategories(cats);
      if (stats.database) {
        setDbInfo({ isConnected: stats.database.isConnected, mode: stats.database.mode });
      }
      window.dispatchEvent(new CustomEvent('librhub-refresh-data'));
    } finally {
      window.setTimeout(() => setIsRefreshing(false), 350);
    }
  };

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      localStorage.setItem('librhub-theme', next);
      document.documentElement.dataset.theme = next;
      window.dispatchEvent(new CustomEvent('librhub-theme-change', { detail: next }));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-800 font-sans antialiased">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-slate-300 shrink-0 z-30">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shadow-xs">
            <Library className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">LibrHub</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                id={`nav-link-${item.path.replace('/', '')}`}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Database Status Indicator */}
        <div className="px-4 py-2">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-800 text-[11px]">
            <div className="flex items-center justify-between text-slate-400 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Database Health
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  dbInfo.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-teal-400'
                }`}
              />
            </div>
            <div className="font-semibold text-slate-200 flex items-center justify-between">
              <span className="capitalize">{dbInfo.mode} Mode</span>
              <span className="text-[10px] text-slate-400">
                {dbInfo.isConnected ? 'Atlas Live' : 'In-Memory Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* LibrHub prompt preview card */}
        <div className="p-4 border-t border-slate-800">
          <div
            id="sidebar-open-ai-card"
            onClick={() => setIsAIOpen(true)}
            className="bg-slate-800 hover:bg-slate-750 cursor-pointer rounded-xl p-4 transition-colors group"
          >
            <p className="text-xs text-slate-400 uppercase font-bold mb-2 tracking-wider flex items-center gap-1.5 group-hover:text-teal-400 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              LibrHub
            </p>
            <p className="text-sm text-slate-200">
              &ldquo;Check overdue books in the library&rdquo;
            </p>
          </div>
        </div>

        {/* User Card & Sign Out */}
        <div className="p-4 flex items-center gap-3 border-t border-slate-800">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-xs shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || 'Admin Librarian'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            id="nav-logout-btn"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center">
            <Library className="w-4 h-4" />
          </div>
          <span className="font-bold text-white text-base tracking-tight">LibrHub</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAIOpen(true)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center gap-1.5 border border-slate-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            AI
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 bg-slate-900 border-b border-slate-800 shadow-2xl p-4 z-40 space-y-1 text-slate-300">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-rose-400 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Sleek Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 hidden sm:flex items-center justify-between px-8 sticky top-0 z-20">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight capitalize">
            {location.pathname === '/dashboard' || location.pathname === '/'
              ? 'Dashboard Overview'
              : location.pathname.replace('/', '').replace('-', ' ')}
          </h1>
          <div className="flex items-center gap-2.5">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              title="Refresh current module"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              id="top-export-report-btn"
              onClick={() => navigate('/reports')}
              className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              Export Report
            </button>
          </div>
        </header>

        {/* Page View Body */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet
            context={{
              openAddBook: () => setIsAddBookOpen(true),
              openIssue: (bookId?: string) => setIsIssueOpen(true),
              openReturn: (bookId?: string) => setIsReturnOpen(true),
              openAI: () => setIsAIOpen(true),
              categories,
            }}
          />
        </div>
      </main>

      {/* Global Modals */}
      <BookModal
        isOpen={isAddBookOpen}
        onClose={() => setIsAddBookOpen(false)}
        onSuccess={refreshData}
        categories={categories}
      />

      <IssueModal
        isOpen={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
        onSuccess={refreshData}
      />

      <ReturnModal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        onSuccess={refreshData}
      />

      <AIAssistantDrawer isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
};

export default DashboardLayout;
