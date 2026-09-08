import React, { useEffect, useMemo, useState } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  Bell,
  BookOpenCheck,
  Shield,
  Database,
  Save,
  RotateCcw,
  RefreshCw,
  Clock3,
  Users,
  Mail,
  Moon,
  Sun,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface LibrarySettings {
  libraryName: string;
  librarianName: string;
  loanDuration: number;
  maxBooksPerMember: number;
  overdueFinePerDay: number;
  gracePeriod: number;
  emailReminders: boolean;
  overdueAlerts: boolean;
  dueDateReminders: boolean;
  autoRefresh: boolean;
  theme: 'light' | 'dark';
  compactTables: boolean;
}

const DEFAULT_SETTINGS: LibrarySettings = {
  libraryName: 'LibrHub Library',
  librarianName: 'Admin Librarian',
  loanDuration: 14,
  maxBooksPerMember: 5,
  overdueFinePerDay: 5,
  gracePeriod: 0,
  emailReminders: true,
  overdueAlerts: true,
  dueDateReminders: true,
  autoRefresh: true,
  theme: 'light',
  compactTables: false,
};

const SETTINGS_KEY = 'librhub-library-settings';

function loadSettings(): LibrarySettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('librhub-theme', theme);
  window.dispatchEvent(new CustomEvent('librhub-theme-change', { detail: theme }));
}

export const SettingsPage: React.FC = () => {
  const { success, info } = useToast();
  const [settings, setSettings] = useState<LibrarySettings>(loadSettings);
  const [savedSettings, setSavedSettings] = useState<LibrarySettings>(loadSettings);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings]
  );

  const loadHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const res = await dashboardApi.getStats();
      setDbStatus(res.database);
    } catch {
      setDbStatus(null);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  useEffect(() => {
    const theme = localStorage.getItem('librhub-theme') as 'light' | 'dark' | null;
    if (theme) {
      setSettings((current) => ({ ...current, theme }));
      setSavedSettings((current) => ({ ...current, theme }));
      applyTheme(theme);
    }
    loadHealth();

    const handleRefresh = () => loadHealth();
    window.addEventListener('librhub-refresh-data', handleRefresh);
    return () => window.removeEventListener('librhub-refresh-data', handleRefresh);
  }, []);

  const update = <K extends keyof LibrarySettings>(key: K, value: LibrarySettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applyTheme(settings.theme);
    setSavedSettings(settings);
    setIsSaving(false);
    success('Library preferences saved successfully.');
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    applyTheme(DEFAULT_SETTINGS.theme);
    info('Settings restored to the recommended library defaults. Click Save to keep them.');
  };

  const toggle = (key: 'emailReminders' | 'overdueAlerts' | 'dueDateReminders' | 'autoRefresh' | 'compactTables') => {
    update(key, !settings[key]);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-600 text-white shadow-sm">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Library Settings</h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure circulation rules, notifications, appearance, and library preferences.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadHealth}
            disabled={isLoadingHealth}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
            title="Refresh system status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingHealth ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={resetSettings}
            className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={saveSettings}
            disabled={!hasChanges || isSaving}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="font-bold text-slate-900">Library & Circulation</h2>
              <p className="text-xs text-slate-500">Defaults used by librarians when managing loans.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="setting-field">
              <span>Library name</span>
              <input value={settings.libraryName} onChange={(e) => update('libraryName', e.target.value)} />
            </label>
            <label className="setting-field">
              <span>Default librarian</span>
              <input value={settings.librarianName} onChange={(e) => update('librarianName', e.target.value)} />
            </label>
            <label className="setting-field">
              <span>Default loan period</span>
              <div className="input-with-suffix"><input type="number" min="1" max="90" value={settings.loanDuration} onChange={(e) => update('loanDuration', Number(e.target.value))} /><b>days</b></div>
            </label>
            <label className="setting-field">
              <span>Maximum books per member</span>
              <div className="input-with-suffix"><input type="number" min="1" max="50" value={settings.maxBooksPerMember} onChange={(e) => update('maxBooksPerMember', Number(e.target.value))} /><Users className="w-4 h-4" /></div>
            </label>
            <label className="setting-field">
              <span>Overdue fine per day</span>
              <div className="input-with-suffix"><span>₹</span><input type="number" min="0" value={settings.overdueFinePerDay} onChange={(e) => update('overdueFinePerDay', Number(e.target.value))} /><b>/day</b></div>
            </label>
            <label className="setting-field">
              <span>Grace period</span>
              <div className="input-with-suffix"><input type="number" min="0" max="30" value={settings.gracePeriod} onChange={(e) => update('gracePeriod', Number(e.target.value))} /><b>days</b></div>
            </label>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="font-bold text-slate-900">Appearance</h2>
              <p className="text-xs text-slate-500">Personalize the librarian workspace.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { update('theme', 'light'); applyTheme('light'); }} className={`theme-card ${settings.theme === 'light' ? 'selected' : ''}`}>
              <Sun className="w-5 h-5" /><span>Light</span>
            </button>
            <button onClick={() => { update('theme', 'dark'); applyTheme('dark'); }} className={`theme-card dark-preview ${settings.theme === 'dark' ? 'selected' : ''}`}>
              <Moon className="w-5 h-5" /><span>Dark</span>
            </button>
          </div>

          <SettingToggle label="Compact catalogue tables" description="Fit more records on one screen." checked={settings.compactTables} onChange={() => toggle('compactTables')} />
          <SettingToggle label="Automatic data refresh" description="Refresh live modules after library actions." checked={settings.autoRefresh} onChange={() => toggle('autoRefresh')} />
        </section>

        <section className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="font-bold text-slate-900">Notifications & Reminders</h2>
              <p className="text-xs text-slate-500">Choose which circulation events deserve attention.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SettingToggle label="Due-date reminders" description="Highlight upcoming returns." checked={settings.dueDateReminders} onChange={() => toggle('dueDateReminders')} />
            <SettingToggle label="Overdue alerts" description="Surface overdue circulation." checked={settings.overdueAlerts} onChange={() => toggle('overdueAlerts')} />
            <SettingToggle label="Email reminders" description="Enable email-ready reminders." checked={settings.emailReminders} onChange={() => toggle('emailReminders')} />
          </div>
          <div className="rounded-xl bg-teal-50 border border-teal-100 p-3 flex gap-2.5 text-xs text-teal-900">
            <Mail className="w-4 h-4 shrink-0 mt-0.5 text-teal-600" />
            <span>These preferences control the portal experience. Email delivery can be connected later through your preferred mail provider.</span>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="font-bold text-slate-900">Access & Security</h2>
              <p className="text-xs text-slate-500">Current portal safeguards.</p>
            </div>
          </div>
          <StatusRow label="Authentication" value="JWT protected" ok />
          <StatusRow label="Password storage" value="Hashed" ok />
          <StatusRow label="Session logout" value="Enabled" ok />
          <StatusRow label="Role" value="Librarian / Admin" ok />
        </section>
      </div>

      <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="font-bold text-slate-900">System Health</h2>
              <p className="text-xs text-slate-500">A compact technical status view for the library administrator.</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${dbStatus?.isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {dbStatus?.isConnected ? 'MongoDB Connected' : 'Demo Storage Active'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <HealthCard icon={Database} label="Storage" value={dbStatus?.mode || 'In-Memory'} />
          <HealthCard icon={Clock3} label="API" value="Port 3000" />
          <HealthCard icon={CheckCircle2} label="Portal" value="Operational" />
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span>Database health is shown here so an administrator can quickly tell whether the portal is using persistent MongoDB storage or the built-in demo store. It is not a user-facing library setting.</span>
        </div>
      </section>
    </div>
  );
};

const SettingToggle: React.FC<{ label: string; description: string; checked: boolean; onChange: () => void }> = ({ label, description, checked, onChange }) => (
  <button type="button" onClick={onChange} className="w-full text-left flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-teal-200 hover:bg-teal-50/40 transition-colors">
    <div className="min-w-0"><div className="text-sm font-bold text-slate-900">{label}</div><div className="text-[11px] text-slate-500 mt-0.5">{description}</div></div>
    <span className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${checked ? 'bg-teal-600' : 'bg-slate-300'}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} /></span>
  </button>
);

const StatusRow: React.FC<{ label: string; value: string; ok?: boolean }> = ({ label, value, ok }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"><span className="text-xs text-slate-500">{label}</span><span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">{ok && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}{value}</span></div>
);

const HealthCard: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"><Icon className="w-3.5 h-3.5 text-teal-600" />{label}</div><div className="mt-1 text-sm font-bold text-slate-900">{value}</div></div>
);

export default SettingsPage;
