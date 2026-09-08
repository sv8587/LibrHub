import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileText,
  CheckCircle2,
  Table,
  Layers,
  Database,
  RefreshCw,
} from 'lucide-react';
import { reportApi, dashboardApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export const ReportsPage: React.FC = () => {
  const { success, error } = useToast();
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const loadStats = async () => {
    try {
      const res = await dashboardApi.getStats();
      setStats(res.data.stats);
    } catch {
      // Keep the last known report summary when the API is temporarily unavailable.
    }
  };

  useEffect(() => {
    loadStats();
    const handleRefresh = () => loadStats();
    window.addEventListener('librhub-refresh-data', handleRefresh);
    return () => window.removeEventListener('librhub-refresh-data', handleRefresh);
  }, []);

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      await reportApi.downloadCsv();
      success('Library transactions CSV exported and downloaded successfully!');
    } catch (err: any) {
      error('Failed to export CSV: ' + err.message);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await reportApi.downloadExcel();
      success('Library transactions Excel workbook exported and downloaded successfully!');
    } catch (err: any) {
      error('Failed to export Excel: ' + err.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-900 text-white shadow-xs">
            <FileSpreadsheet className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Reports & Audit Data Export
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Export complete circulation history and catalog records directly from the database into standard CSV and Excel formats.
            </p>
          </div>
        </div>
        <button onClick={loadStats} title="Refresh report summary" className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shrink-0">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                <FileText className="w-5 h-5" />
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-slate-100 text-slate-700">
                .CSV FORMAT
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900">Standard CSV Export</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export complete transaction history formatted with exact required columns:
              <br />
              <code className="text-[11px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-slate-700 mt-1 block font-mono">
                Book Title, Author, Book ID, Issued To, User ID, Issue Timestamp, Return Timestamp, Current Status
              </code>
            </p>
          </div>

          <button
            id="export-csv-btn"
            onClick={handleExportCsv}
            disabled={isExportingCsv}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExportingCsv ? 'Generating CSV...' : 'Export CSV'}
          </button>
        </div>

        {/* Excel Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
                <Table className="w-5 h-5" />
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-teal-50 text-teal-700 border border-teal-100">
                .XLSX FORMAT
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900">Spreadsheet Excel Workbook</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Formatted Microsoft Excel workbook generated via the <code>xlsx</code> engine with custom column widths, calculated overdue days, and categorized sheets.
            </p>
          </div>

          <button
            id="export-excel-btn"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm shadow-teal-200 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExportingExcel ? 'Generating Workbook...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Dataset Summary Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-600" />
          Live Dataset Verification
        </h3>
        <p className="text-xs text-slate-500">
          The export engines stream actual records from the active MongoDB database or verified in-memory store.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Catalog Titles</span>
            <div className="text-lg font-black text-slate-900 mt-1">
              {stats?.totalBooks ?? '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Physical Copies</span>
            <div className="text-lg font-black text-slate-900 mt-1">
              {stats?.totalPhysicalCopies ?? '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Copies</span>
            <div className="text-lg font-black text-emerald-700 mt-1">
              {stats?.availableBooks ?? '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Loans</span>
            <div className="text-lg font-black text-teal-600 mt-1">
              {stats?.issuedBooks ?? '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
