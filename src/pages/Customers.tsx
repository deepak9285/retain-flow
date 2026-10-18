import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, X, AlertTriangle } from 'lucide-react';
import { fetchAllData } from '../lib/integrations/sheets';
import type { Customer, Visit, CustomerWithLastVisit } from '../types';

function daysSince(dateStr: string): number {
  const now = new Date();
  const d = new Date(dateStr);
  return Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
}

function reviewBadge(status: Visit['review_status']) {
  switch (status) {
    case 'received':  return <span className="badge-green">Received</span>;
    case 'requested': return <span className="badge-blue">Requested</span>;
    case 'pending':   return <span className="badge-yellow">Pending</span>;
    default:          return <span className="badge-gray">—</span>;
  }
}

function buildCustomerList(customers: Customer[], visits: Visit[]): CustomerWithLastVisit[] {
  return customers.map((c) => {
    const cVisits = visits
      .filter((v) => v.customer_id === c.customer_id)
      .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());

    const firstVisit = cVisits[cVisits.length - 1];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return {
      ...c,
      last_visit: cVisits[0],
      visit_count: cVisits.length,
      total_spend: cVisits.reduce((s, v) => s + v.price, 0),
      is_new: firstVisit ? new Date(firstVisit.visit_date) >= thirtyDaysAgo : false,
    };
  });
}

export default function Customers() {
  const [allCustomers, setAllCustomers] = useState<CustomerWithLastVisit[]>([]);
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData().then((result) => {
      setAllCustomers(buildCustomerList(result.customers, result.visits));
      setAllVisits(result.visits);
      setDataError(result.error ?? '');
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return allCustomers;
    const q = query.toLowerCase();
    return allCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [allCustomers, query]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Customers</h2>
          <p className="text-xs text-gray-500">
            {loading ? 'Loading…' : `${allCustomers.length} customers`}
          </p>
        </div>
      </div>

      {dataError && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {dataError}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id="customer-search"
          type="text"
          placeholder="Search by name or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input pl-9 pr-9"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Customers table">
            <thead>
              <tr className="table-head">
                <th className="table-cell text-left font-semibold">Customer</th>
                <th className="table-cell text-left font-semibold hidden sm:table-cell">Last Service</th>
                <th className="table-cell text-left font-semibold hidden md:table-cell">Price</th>
                <th className="table-cell text-left font-semibold">Last Visit</th>
                <th className="table-cell text-left font-semibold hidden lg:table-cell">Review</th>
                <th className="table-cell text-left font-semibold hidden lg:table-cell">Opt-in</th>
                <th className="table-cell w-8" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="table-cell">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-gray-400 py-10">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isExpanded = expandedId === c.customer_id;
                  const visits = allVisits
                    .filter((v) => v.customer_id === c.customer_id)
                    .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());

                  return (
                    <>
                      <tr
                        key={c.customer_id}
                        className="table-row cursor-pointer"
                        onClick={() => toggleExpand(c.customer_id)}
                        aria-expanded={isExpanded}
                      >
                        <td className="table-cell">
                          <div>
                            <p className="font-medium text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.phone}</p>
                          </div>
                        </td>
                        <td className="table-cell text-gray-600 hidden sm:table-cell">
                          {c.last_visit?.service ?? '—'}
                        </td>
                        <td className="table-cell text-gray-600 hidden md:table-cell">
                          {c.last_visit ? `₹${c.last_visit.price.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="table-cell">
                          {c.last_visit ? (
                            <div>
                              <p className="text-gray-700">
                                {new Date(c.last_visit.visit_date).toLocaleDateString('en-IN', {
                                  day: 'numeric', month: 'short',
                                })}
                              </p>
                              <p className="text-xs text-gray-400">
                                {daysSince(c.last_visit.visit_date)}d ago
                              </p>
                            </div>
                          ) : '—'}
                        </td>
                        <td className="table-cell hidden lg:table-cell">
                          {c.last_visit ? reviewBadge(c.last_visit.review_status) : '—'}
                        </td>
                        <td className="table-cell hidden lg:table-cell">
                          {c.marketing_opt_in
                            ? <span className="badge-green">Yes</span>
                            : <span className="badge-gray">No</span>}
                        </td>
                        <td className="table-cell text-gray-400">
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />}
                        </td>
                      </tr>

                      {/* Visit history panel */}
                      {isExpanded && (
                        <tr key={`${c.customer_id}-history`} className="bg-gray-50">
                          <td colSpan={7} className="px-5 pb-4 pt-2">
                            <div className="border-l-2 border-green-200 pl-4 space-y-1">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Visit History · {visits.length} visits · ₹{c.total_spend.toLocaleString('en-IN')} total
                              </p>
                              {visits.map((v) => (
                                <div
                                  key={v.visit_id}
                                  className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-400 text-xs w-20 flex-shrink-0">
                                      {new Date(v.visit_date).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'short', year: 'numeric',
                                      })}
                                    </span>
                                    <span className="text-gray-700">{v.service}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-600 font-medium">
                                      ₹{v.price.toLocaleString('en-IN')}
                                    </span>
                                    {reviewBadge(v.review_status)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {allCustomers.length} customers
            {query && ` · filtered by "${query}"`}
          </div>
        )}
      </div>
    </div>
  );
}
