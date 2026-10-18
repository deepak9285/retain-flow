import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    label: string;
    positive?: boolean;
  };
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-green-600',
  trend,
}: MetricCardProps) {
  return (
    <div className="card-padded flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <div className={`${iconColor} opacity-70`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <p className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      {trend && (
        <p className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-gray-500'}`}>
          {trend.label}
        </p>
      )}
    </div>
  );
}
