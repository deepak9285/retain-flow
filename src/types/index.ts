// ─── Data Model Types ─────────────────────────────────────────────────────────

export interface Customer {
  customer_id: string;
  name: string;
  phone: string;
  email: string;
  marketing_opt_in: boolean;
  created_at: string; // ISO date string
}

export interface Visit {
  visit_id: string;
  customer_id: string;
  service: string;
  price: number; // INR
  visit_date: string; // ISO date string
  review_status: 'pending' | 'requested' | 'received' | 'none';
}

export interface Campaign {
  campaign_id: string;
  campaign_name?: string;
  message: string;
  created_at: string;
  recipient_count?: number;
  status?: string;
  sent_count?: number;
  delivered_count?: number;
  failed_count?: number;
}

export type CampaignRecipientStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'opted_out';

export interface CampaignRecipient {
  campaign_id: string;
  customer_id: string;
  status: CampaignRecipientStatus;
  customer?: Customer; // joined
}

// ─── Derived / Computed Types ──────────────────────────────────────────────────

export interface CustomerWithLastVisit extends Customer {
  last_visit?: Visit;
  visit_count: number;
  total_spend: number;
  is_new: boolean; // first visit within selected period
}

export interface DashboardStats {
  total_revenue: number;
  total_customers: number;
  new_customers: number;
  returning_customers: number;
  total_visits: number;
  at_risk_customers: CustomerWithLastVisit[]; // last visit 30-60 days ago
}

export type PeriodDays = 30 | 60 | 90 | 'all';

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface SalonSettings {
  salon_name: string;
  google_review_url: string;
  n8n_webhook_url: string;
  n8n_enabled: boolean;
}

// ─── Integration Status ────────────────────────────────────────────────────────

export interface IntegrationStatus {
  sheets_enabled: boolean;
  n8n_enabled: boolean;
  n8n_webhook_configured: boolean;
}
