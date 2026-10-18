// n8n Webhook Integration Layer
// ─────────────────────────────────────────────────────────────────────────────
// This module handles all communication with n8n workflows.
// The n8n webhook URL is stored in Supabase (owner settings row) and
// retrieved at runtime — never hardcoded or exposed in source.
//
// n8n Webhook Payload — Campaign Send (POST):
// {
//   "campaign_id": "camp_xxx",
//   "message_template": "Hi {name}! ...",
//   "google_review_url": "https://...",
//   "recipients": [
//     { "customer_id": "c1", "name": "Priya Sharma", "phone": "9876543210" }
//   ]
// }
//
// n8n should respond with HTTP 200 and:
// { "accepted": true, "queued": 12 }
//
// n8n Status Endpoint (GET ?campaign_id=xxx):
// Response: { "results": [{ "customer_id": "...", "status": "delivered" }] }
//
// WhatsApp messages are sent by n8n using Meta WhatsApp Cloud API.
// The Meta access token lives ONLY in n8n — never in this frontend.

export interface CampaignPayload {
  campaign_id: string;
  message_template: string;
  google_review_url: string;
  recipients: Array<{
    customer_id: string;
    name: string;
    phone: string;
  }>;
}

export interface CampaignSendResult {
  accepted: boolean;
  queued: number;
  error?: string;
}

export interface RecipientStatus {
  customer_id: string;
  status: 'sent' | 'delivered' | 'failed' | 'opted_out';
}

export interface CampaignStatusResult {
  results: RecipientStatus[];
  error?: string;
}

export async function sendCampaignViaWebhook(
  webhookUrl: string,
  payload: CampaignPayload
): Promise<CampaignSendResult> {
  if (!webhookUrl) {
    return {
      accepted: false,
      queued: 0,
      error: 'n8n webhook URL is not configured. Please add it in Settings.',
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        accepted: false,
        queued: 0,
        error: `n8n returned ${res.status}: ${text}`,
      };
    }

    const data = await res.json();
    return {
      accepted: data.accepted ?? true,
      queued: data.queued ?? payload.recipients.length,
    };
  } catch (err) {
    return {
      accepted: false,
      queued: 0,
      error: err instanceof Error ? err.message : 'Network error contacting n8n',
    };
  }
}

export async function fetchCampaignStatus(
  webhookUrl: string,
  campaignId: string
): Promise<CampaignStatusResult> {
  if (!webhookUrl) {
    return { results: [], error: 'n8n webhook URL not configured' };
  }

  // Append /status to base webhook URL (adjust per your n8n setup)
  const statusUrl = `${webhookUrl.replace(/\/$/, '')}/status?campaign_id=${encodeURIComponent(campaignId)}`;

  try {
    const res = await fetch(statusUrl, { method: 'GET' });
    if (!res.ok) {
      return { results: [], error: `n8n status endpoint returned ${res.status}` };
    }
    const data = await res.json();
    return { results: data.results ?? [] };
  } catch (err) {
    return {
      results: [],
      error: err instanceof Error ? err.message : 'Network error fetching status',
    };
  }
}
