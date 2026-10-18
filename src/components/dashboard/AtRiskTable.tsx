import { AlertTriangle } from 'lucide-react';
import type { CustomerWithLastVisit } from '../../types';

interface AtRiskTableProps {
  customers: CustomerWithLastVisit[];
}

function daysSince(dateStr: string): number {
  const now = new Date();
  const d = new Date(dateStr);
  return Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
}

export default function AtRiskTable({ customers }: AtRiskTableProps) {
  if (customers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">No at-risk customers right now.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" aria-label="At-risk customers">
        <thead>
          <tr className="table-head">
            <th className="table-cell text-left font-semibold">Customer</th>
            <th className="table-cell text-left font-semibold">Last Service</th>
            <th className="table-cell text-left font-semibold">Last Visit</th>
            <th className="table-cell text-left font-semibold">Days Since</th>
            <th className="table-cell text-left font-semibold">Opt-in</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => {
            const days = c.last_visit ? daysSince(c.last_visit.visit_date) : 0;
            return (
              <tr key={c.customer_id} className="table-row">
                <td className="table-cell">
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.phone}</p>
                  </div>
                </td>
                <td className="table-cell text-gray-600">
                  {c.last_visit?.service ?? '—'}
                </td>
                <td className="table-cell text-gray-600">
                  {c.last_visit
                    ? new Date(c.last_visit.visit_date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="table-cell">
                  <span className="badge-yellow">{days}d ago</span>
                </td>
                <td className="table-cell">
                  {c.marketing_opt_in ? (
                    <span className="badge-green">Opted in</span>
                  ) : (
                    <span className="badge-gray">Opted out</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
