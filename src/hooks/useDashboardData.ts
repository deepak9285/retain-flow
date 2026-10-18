import { useState, useEffect, useCallback } from 'react';
import { fetchAllData, type DataSourceResult } from '../lib/integrations/sheets';
import type { CustomerWithLastVisit, DashboardStats, PeriodDays } from '../types';

function computeStats(
  data: DataSourceResult,
  period: PeriodDays
): DashboardStats {
  const { customers, visits } = data;
  const now = new Date();

  const periodStart = period === 'all'
    ? new Date(0)
    : new Date(now.getTime() - period * 24 * 60 * 60 * 1000);

  // Filter visits for selected period
  const periodVisits = visits.filter(
    (v) => new Date(v.visit_date) >= periodStart
  );

  // Build customer map with latest visit info
  const customerMap = new Map<string, CustomerWithLastVisit>();

  for (const c of customers) {
    const allVisits = visits
      .filter((v) => v.customer_id === c.customer_id)
      .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());

    const periodVisitsForCustomer = allVisits.filter(
      (v) => new Date(v.visit_date) >= periodStart
    );

    if (periodVisitsForCustomer.length === 0 && period !== 'all') continue;

    const firstVisitEver = allVisits[allVisits.length - 1];
    const isNew = firstVisitEver
      ? new Date(firstVisitEver.visit_date) >= periodStart
      : false;

    customerMap.set(c.customer_id, {
      ...c,
      last_visit: allVisits[0],
      visit_count: periodVisitsForCustomer.length,
      total_spend: periodVisitsForCustomer.reduce((sum, v) => sum + v.price, 0),
      is_new: isNew,
    });
  }

  const activeCustomers = Array.from(customerMap.values());

  // At-risk: last visit 30-60 days ago (not dependent on period)
  const atRiskCustomers: CustomerWithLastVisit[] = [];
  for (const c of customers) {
    const allVisits = visits
      .filter((v) => v.customer_id === c.customer_id)
      .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());

    if (allVisits.length === 0) continue;
    const lastVisitDate = new Date(allVisits[0].visit_date);
    const daysSince = Math.floor(
      (now.getTime() - lastVisitDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysSince >= 30 && daysSince <= 60) {
      atRiskCustomers.push({
        ...c,
        last_visit: allVisits[0],
        visit_count: allVisits.length,
        total_spend: allVisits.reduce((sum, v) => sum + v.price, 0),
        is_new: false,
      });
    }
  }

  const totalRevenue = periodVisits.reduce((sum, v) => sum + v.price, 0);
  const newCustomers = activeCustomers.filter((c) => c.is_new).length;

  return {
    total_revenue: totalRevenue,
    total_customers: activeCustomers.length,
    new_customers: newCustomers,
    returning_customers: activeCustomers.length - newCustomers,
    total_visits: periodVisits.length,
    at_risk_customers: atRiskCustomers,
  };
}

export function useDashboardData() {
  const [data, setData] = useState<DataSourceResult | null>(null);
  const [period, setPeriod] = useState<PeriodDays>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAllData();
      setData(result);
      setError(result.error ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = data ? computeStats(data, period) : null;

  return {
    data,
    stats,
    period,
    setPeriod,
    loading,
    error,
    refresh: load,
  };
}

export { computeStats };
