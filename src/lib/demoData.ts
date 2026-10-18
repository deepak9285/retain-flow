// DEMO DATA — Replace with live Google Sheets integration
// All customer names, phone numbers and visit records below are fictional.
// See src/lib/integrations/sheets.ts to enable live data.

import type { Customer, Visit, Campaign, CampaignRecipient } from '../types';

const now = new Date();
const daysAgo = (d: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() - d);
  return date.toISOString();
};

// ─── Customers ────────────────────────────────────────────────────────────────

export const DEMO_CUSTOMERS: Customer[] = [
  { customer_id: 'c1',  name: 'Priya Sharma',     phone: '9876543210', email: 'priya.sharma@gmail.com',    marketing_opt_in: true,  created_at: daysAgo(210) },
  { customer_id: 'c2',  name: 'Anita Desai',      phone: '9823456781', email: 'anita.desai@gmail.com',     marketing_opt_in: true,  created_at: daysAgo(180) },
  { customer_id: 'c3',  name: 'Meera Joshi',      phone: '9765432109', email: 'meera.joshi@yahoo.com',     marketing_opt_in: false, created_at: daysAgo(160) },
  { customer_id: 'c4',  name: 'Sunita Patil',     phone: '9812345678', email: 'sunita.patil@gmail.com',    marketing_opt_in: true,  created_at: daysAgo(150) },
  { customer_id: 'c5',  name: 'Kavita Rane',      phone: '9988776655', email: 'kavita.rane@rediffmail.com', marketing_opt_in: true,  created_at: daysAgo(140) },
  { customer_id: 'c6',  name: 'Deepika Kulkarni', phone: '9900112233', email: 'deepika.k@gmail.com',       marketing_opt_in: true,  created_at: daysAgo(130) },
  { customer_id: 'c7',  name: 'Shweta Mehta',     phone: '9876001122', email: 'shweta.mehta@gmail.com',    marketing_opt_in: true,  created_at: daysAgo(120) },
  { customer_id: 'c8',  name: 'Pooja Nair',       phone: '9834567890', email: 'pooja.nair@gmail.com',      marketing_opt_in: false, created_at: daysAgo(110) },
  { customer_id: 'c9',  name: 'Riddhi Shah',      phone: '9922334455', email: 'riddhi.shah@gmail.com',     marketing_opt_in: true,  created_at: daysAgo(100) },
  { customer_id: 'c10', name: 'Neha Bhosale',     phone: '9800998877', email: 'neha.b@gmail.com',          marketing_opt_in: true,  created_at: daysAgo(90) },
  { customer_id: 'c11', name: 'Anjali Thakur',    phone: '9876543000', email: 'anjali.t@gmail.com',        marketing_opt_in: true,  created_at: daysAgo(80) },
  { customer_id: 'c12', name: 'Sonal Gupta',      phone: '9823004567', email: 'sonal.gupta@gmail.com',     marketing_opt_in: true,  created_at: daysAgo(70) },
  { customer_id: 'c13', name: 'Pallavi Chavan',   phone: '9765000321', email: 'pallavi.c@outlook.com',     marketing_opt_in: false, created_at: daysAgo(65) },
  { customer_id: 'c14', name: 'Usha Kadam',       phone: '9812000999', email: 'usha.kadam@gmail.com',      marketing_opt_in: true,  created_at: daysAgo(55) },
  { customer_id: 'c15', name: 'Rekha Wagh',       phone: '9988000777', email: 'rekha.wagh@gmail.com',      marketing_opt_in: true,  created_at: daysAgo(45) },
  { customer_id: 'c16', name: 'Varsha More',      phone: '9900000888', email: 'varsha.more@gmail.com',     marketing_opt_in: true,  created_at: daysAgo(35) },
  { customer_id: 'c17', name: 'Tejal Pawar',      phone: '9876000333', email: 'tejal.p@gmail.com',         marketing_opt_in: true,  created_at: daysAgo(25) },
  { customer_id: 'c18', name: 'Mansi Kale',       phone: '9834000444', email: 'mansi.kale@gmail.com',      marketing_opt_in: true,  created_at: daysAgo(18) },
  { customer_id: 'c19', name: 'Sheetal Shinde',   phone: '9922000555', email: 'sheetal.s@gmail.com',       marketing_opt_in: false, created_at: daysAgo(12) },
  { customer_id: 'c20', name: 'Gauri Sawant',     phone: '9800000666', email: 'gauri.sawant@gmail.com',    marketing_opt_in: true,  created_at: daysAgo(5) },
];

// ─── Visits ───────────────────────────────────────────────────────────────────

const SERVICES = [
  'Hair Cut & Styling',
  'Full Body Waxing',
  'Facial – Gold',
  'Manicure & Pedicure',
  'Hair Colour – Global',
  'Keratin Treatment',
  'Eyebrow Threading & Tint',
  'Bridal Makeup',
  'Deep Conditioning',
  'Head Massage',
];

const PRICES: Record<string, number> = {
  'Hair Cut & Styling': 500,
  'Full Body Waxing': 800,
  'Facial – Gold': 1200,
  'Manicure & Pedicure': 700,
  'Hair Colour – Global': 2500,
  'Keratin Treatment': 3500,
  'Eyebrow Threading & Tint': 300,
  'Bridal Makeup': 6000,
  'Deep Conditioning': 900,
  'Head Massage': 400,
};

const rs = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const DEMO_VISITS: Visit[] = [
  // c1 - Priya - active, multiple visits
  { visit_id: 'v1',  customer_id: 'c1',  service: 'Hair Cut & Styling',     price: 500,  visit_date: daysAgo(180), review_status: 'received' },
  { visit_id: 'v2',  customer_id: 'c1',  service: 'Facial – Gold',          price: 1200, visit_date: daysAgo(120), review_status: 'received' },
  { visit_id: 'v3',  customer_id: 'c1',  service: 'Keratin Treatment',      price: 3500, visit_date: daysAgo(60),  review_status: 'requested' },
  { visit_id: 'v4',  customer_id: 'c1',  service: 'Eyebrow Threading & Tint', price: 300, visit_date: daysAgo(14), review_status: 'none' },

  // c2 - Anita - at-risk (last visit 35 days ago)
  { visit_id: 'v5',  customer_id: 'c2',  service: 'Full Body Waxing',       price: 800,  visit_date: daysAgo(130), review_status: 'received' },
  { visit_id: 'v6',  customer_id: 'c2',  service: 'Manicure & Pedicure',    price: 700,  visit_date: daysAgo(75),  review_status: 'received' },
  { visit_id: 'v7',  customer_id: 'c2',  service: 'Hair Cut & Styling',     price: 500,  visit_date: daysAgo(35),  review_status: 'pending' },

  // c3 - Meera - opted out, at-risk
  { visit_id: 'v8',  customer_id: 'c3',  service: 'Facial – Gold',          price: 1200, visit_date: daysAgo(100), review_status: 'received' },
  { visit_id: 'v9',  customer_id: 'c3',  service: 'Deep Conditioning',      price: 900,  visit_date: daysAgo(42),  review_status: 'none' },

  // c4 - Sunita - at-risk
  { visit_id: 'v10', customer_id: 'c4',  service: 'Bridal Makeup',          price: 6000, visit_date: daysAgo(110), review_status: 'received' },
  { visit_id: 'v11', customer_id: 'c4',  service: 'Hair Colour – Global',   price: 2500, visit_date: daysAgo(55),  review_status: 'requested' },

  // c5 - Kavita - recent
  { visit_id: 'v12', customer_id: 'c5',  service: 'Manicure & Pedicure',    price: 700,  visit_date: daysAgo(80),  review_status: 'received' },
  { visit_id: 'v13', customer_id: 'c5',  service: 'Eyebrow Threading & Tint', price: 300, visit_date: daysAgo(7),  review_status: 'none' },

  // c6 - Deepika - at-risk
  { visit_id: 'v14', customer_id: 'c6',  service: 'Full Body Waxing',       price: 800,  visit_date: daysAgo(95),  review_status: 'received' },
  { visit_id: 'v15', customer_id: 'c6',  service: 'Facial – Gold',          price: 1200, visit_date: daysAgo(50),  review_status: 'requested' },

  // c7 - Shweta - at-risk
  { visit_id: 'v16', customer_id: 'c7',  service: 'Keratin Treatment',      price: 3500, visit_date: daysAgo(45),  review_status: 'received' },

  // c8 - Pooja - opted out
  { visit_id: 'v17', customer_id: 'c8',  service: 'Head Massage',           price: 400,  visit_date: daysAgo(38),  review_status: 'none' },

  // c9 - Riddhi - recent
  { visit_id: 'v18', customer_id: 'c9',  service: 'Hair Colour – Global',   price: 2500, visit_date: daysAgo(20),  review_status: 'none' },

  // c10 - Neha - recent
  { visit_id: 'v19', customer_id: 'c10', service: 'Deep Conditioning',      price: 900,  visit_date: daysAgo(15),  review_status: 'none' },
  { visit_id: 'v20', customer_id: 'c10', service: 'Manicure & Pedicure',    price: 700,  visit_date: daysAgo(5),   review_status: 'none' },

  // c11 - Anjali - at-risk
  { visit_id: 'v21', customer_id: 'c11', service: 'Full Body Waxing',       price: 800,  visit_date: daysAgo(32),  review_status: 'pending' },

  // c12 - Sonal - recent
  { visit_id: 'v22', customer_id: 'c12', service: 'Hair Cut & Styling',     price: 500,  visit_date: daysAgo(10),  review_status: 'none' },

  // c13 - Pallavi - at-risk, opted out
  { visit_id: 'v23', customer_id: 'c13', service: 'Facial – Gold',          price: 1200, visit_date: daysAgo(58),  review_status: 'received' },

  // c14 - Usha - new, recent
  { visit_id: 'v24', customer_id: 'c14', service: 'Eyebrow Threading & Tint', price: 300, visit_date: daysAgo(8),  review_status: 'none' },

  // c15 - Rekha - new, very recent
  { visit_id: 'v25', customer_id: 'c15', service: 'Manicure & Pedicure',    price: 700,  visit_date: daysAgo(3),   review_status: 'none' },

  // c16 - Varsha - new
  { visit_id: 'v26', customer_id: 'c16', service: 'Hair Colour – Global',   price: 2500, visit_date: daysAgo(20),  review_status: 'none' },

  // c17 - Tejal - new
  { visit_id: 'v27', customer_id: 'c17', service: 'Head Massage',           price: 400,  visit_date: daysAgo(22),  review_status: 'pending' },

  // c18 - Mansi - new
  { visit_id: 'v28', customer_id: 'c18', service: 'Full Body Waxing',       price: 800,  visit_date: daysAgo(14),  review_status: 'none' },

  // c19 - Sheetal - new, opted out
  { visit_id: 'v29', customer_id: 'c19', service: 'Keratin Treatment',      price: 3500, visit_date: daysAgo(10),  review_status: 'none' },

  // c20 - Gauri - brand new
  { visit_id: 'v30', customer_id: 'c20', service: 'Hair Cut & Styling',     price: 500,  visit_date: daysAgo(2),   review_status: 'none' },
];

// ─── Past Campaigns ───────────────────────────────────────────────────────────

export const DEMO_CAMPAIGNS: Campaign[] = [
  {
    campaign_id: 'camp1',
    message: `Hi {name}! 😊 We miss you at Bloom Salon, Pune. It's been a while since your last visit. Book your next appointment this week and enjoy 10% off on any service. Call us at 9800001234 or WhatsApp to book. See you soon! 🌸`,
    created_at: daysAgo(45),
    sent_count: 12,
    delivered_count: 10,
    failed_count: 2,
  },
  {
    campaign_id: 'camp2',
    message: `Hi {name}! Thank you for visiting Bloom Salon. We'd love your feedback — it helps us serve you better. Please leave us a Google review here: {review_url}. Takes just 2 minutes! 🙏`,
    created_at: daysAgo(20),
    sent_count: 8,
    delivered_count: 8,
    failed_count: 0,
  },
];

export const DEMO_CAMPAIGN_RECIPIENTS: CampaignRecipient[] = [
  { campaign_id: 'camp1', customer_id: 'c1',  status: 'delivered' },
  { campaign_id: 'camp1', customer_id: 'c2',  status: 'delivered' },
  { campaign_id: 'camp1', customer_id: 'c4',  status: 'delivered' },
  { campaign_id: 'camp1', customer_id: 'c5',  status: 'delivered' },
  { campaign_id: 'camp1', customer_id: 'c6',  status: 'delivered' },
  { campaign_id: 'camp1', customer_id: 'c7',  status: 'delivered' },
  { campaign_id: 'camp1', customer_id: 'c9',  status: 'failed' },
  { campaign_id: 'camp1', customer_id: 'c10', status: 'failed' },
  { campaign_id: 'camp1', customer_id: 'c11', status: 'delivered' },
  { campaign_id: 'camp1', customer_id: 'c12', status: 'delivered' },
  { campaign_id: 'camp1', customer_id: 'c14', status: 'delivered' },
  { campaign_id: 'camp1', customer_id: 'c15', status: 'delivered' },
  { campaign_id: 'camp2', customer_id: 'c1',  status: 'delivered' },
  { campaign_id: 'camp2', customer_id: 'c2',  status: 'delivered' },
  { campaign_id: 'camp2', customer_id: 'c5',  status: 'delivered' },
  { campaign_id: 'camp2', customer_id: 'c6',  status: 'delivered' },
  { campaign_id: 'camp2', customer_id: 'c9',  status: 'delivered' },
  { campaign_id: 'camp2', customer_id: 'c11', status: 'delivered' },
  { campaign_id: 'camp2', customer_id: 'c14', status: 'delivered' },
  { campaign_id: 'camp2', customer_id: 'c15', status: 'delivered' },
];

// ─── Default Settings ─────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  salon_name: 'Bloom Salon',
  google_review_url: 'https://g.page/r/bloom-salon-pune/review',
  n8n_webhook_url: '',
  n8n_enabled: false,
};
