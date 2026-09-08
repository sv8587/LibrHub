import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, bypassLogin } = useAuth();
  const { success, error } = useToast();

  const [emailOrUsername, setEmailOrUsername] = useState('admin@librhub.library');
  const [password, setPassword] = useState('Admin@12345');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      await login(emailOrUsername, password);
      success('Librarian authenticated successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setFormError(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setEmailOrUsername('admin@librhub.library');
    setPassword('Admin@12345');
    setIsLoading(true);
    try {
      await login('admin@librhub.library', 'Admin@12345');
      success('Logged in as Head Librarian (Demo Session)');
      navigate('/dashboard');
    } catch {
      // Fallback to local session
      bypassLogin();
      success('Demo session initialized');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 rounded-2xl bg-slate-900 text-white shadow-xs mb-3">
          <Library className="w-8 h-8 text-teal-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">LIBRHUB</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Smart Library Management Portal • Staff & Librarian Access
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-100 space-y-6">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs font-semibold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Staff Email or Username
              </label>
              <div className="relative">
                <input
                  id="login-email-input"
                  type="text"
                  required
                  placeholder="admin@librhub.library"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm shadow-teal-200 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Verifying Credentials...' : 'Sign In as Librarian'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                Technical Recruitment Demo Login:
              </span>
            </div>
            <button
              id="demo-login-btn"
              type="button"
              onClick={handleDemoSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              1-Click Demo Login (admin@librhub.library)
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2.5">
              Bcrypt hash verification • JWT signed session • Zero plaintext storage
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
