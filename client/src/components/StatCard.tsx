import React from 'react';
import { LucideIcon, TrendingUp, AlertTriangle } from 'lucide-react';

interface StatCardProps {
  id: string;
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  colorScheme: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo';
  onClick?: () => void;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme,
  onClick,
  trend,
}) => {
  const isOverdue = colorScheme === 'rose';

  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-200' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <div className="p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
          <Icon className="w-4 h-4 text-slate-600" />
        </div>
      </div>

      <p className={`text-3xl font-bold tracking-tight ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
        {value}
      </p>

      {isOverdue ? (
        <div className="mt-2 flex items-center gap-1.5 text-rose-600 text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Requires attention • {subtitle}</span>
        </div>
      ) : trend ? (
        <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
          <span>{trend}</span>
        </div>
      ) : (
        <p className="mt-2 text-slate-400 text-xs">{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;
