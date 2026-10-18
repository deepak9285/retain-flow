import type { PeriodDays } from '../../types';

interface PeriodSelectorProps {
  value: PeriodDays;
  onChange: (p: PeriodDays) => void;
}

const OPTIONS: { label: string; value: PeriodDays }[] = [
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 60 days', value: 60 },
  { label: 'Last 90 days', value: 90 },
  { label: 'All time',     value: 'all' },
];

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md" role="group" aria-label="Time period">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          id={`period-${opt.value}`}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            value === opt.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
