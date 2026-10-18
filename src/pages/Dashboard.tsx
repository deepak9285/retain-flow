import {
  IndianRupee,
  Users,
  UserPlus,
  Repeat2,
  Scissors,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import MetricCard from '../components/dashboard/MetricCard';
import PeriodSelector from '../components/dashboard/PeriodSelector';
import AtRiskTable from '../components/dashboard/AtRiskTable';
import { useDashboardData } from '../hooks/useDashboardData';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Dashboard() {
  const { stats, period, setPeriod, loading, error, refresh } = useDashboardData();

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Overview</h2>
            <p className="text-xs text-gray-500">Track your salon's performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodSelector value={period} onChange={setPeriod} />
          <button
            id="dashboard-refresh"
            onClick={refresh}
            className="btn-ghost p-1.5"
            title="Refresh data"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Data source error: {error}
        </div>
      )}

      {/* Metric cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-padded animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-7 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total Revenue"
            value={formatINR(stats.total_revenue)}
            icon={IndianRupee}
            iconColor="text-green-600"
            subtitle="From service visits"
          />
          <MetricCard
            title="Customers"
            value={stats.total_customers}
            icon={Users}
            iconColor="text-blue-500"
            subtitle="Unique visitors"
          />
          <MetricCard
            title="New Customers"
            value={stats.new_customers}
            icon={UserPlus}
            iconColor="text-purple-500"
            subtitle="First visit in period"
          />
          <MetricCard
            title="Returning"
            value={stats.returning_customers}
            icon={Repeat2}
            iconColor="text-orange-500"
            subtitle="Repeat visitors"
          />
          <MetricCard
            title="Service Visits"
            value={stats.total_visits}
            icon={Scissors}
            iconColor="text-gray-500"
            subtitle="Total appointments"
          />
        </div>
      ) : null}

      {/* At-risk customers */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">At-Risk Customers</h3>
          </div>
          <span className="text-xs text-gray-500">
            Last visit 30–60 days ago
          </span>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            <AtRiskTable customers={stats.at_risk_customers} />
            {stats.at_risk_customers.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {stats.at_risk_customers.filter((c) => c.marketing_opt_in).length} eligible for WhatsApp campaign
                </p>
                <a href="/campaigns" className="text-xs font-medium text-green-600 hover:text-green-700">
                  Start campaign →
                </a>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
