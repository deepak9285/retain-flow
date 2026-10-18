import { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Check,
  X,
  AlertTriangle,
  Send,
  Loader2,
  Info,
  CheckSquare,
  Square,
} from 'lucide-react';
import { fetchAllData } from '../lib/integrations/sheets';
import { sendCampaignViaWebhook, type CampaignPayload } from '../lib/integrations/n8n';
import { DEFAULT_SETTINGS } from '../lib/demoData';
import type { Customer, Visit, Campaign, CampaignRecipient } from '../types';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000)
  );
}

function statusBadge(status: CampaignRecipient['status']) {
  switch (status) {
    case 'sent':      return <span className="badge-blue">Sent</span>;
    case 'delivered': return <span className="badge-green">Delivered</span>;
    case 'failed':    return <span className="badge-red">Failed</span>;
    case 'opted_out': return <span className="badge-gray">Opted out</span>;
    default:          return <span className="badge-gray">Pending</span>;
  }
}

// ─── Confirm Modal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  recipientCount: number;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmModal({ recipientCount, message, onConfirm, onCancel, loading }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Confirm Campaign</h4>
            <p className="text-xs text-gray-500 mt-0.5">Review before sending</p>
          </div>
          <button onClick={onCancel} className="btn-ghost p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              This will send a WhatsApp message to <strong>{recipientCount} customer{recipientCount !== 1 ? 's' : ''}</strong> via n8n.
              This action cannot be undone.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Message preview:</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-100 text-xs leading-relaxed">
              {message.replace('{name}', 'Customer Name')}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button onClick={onCancel} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button
            id="campaign-confirm-send"
            onClick={onConfirm}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
            ) : (
              <><Send className="w-4 h-4" /> Send Campaign</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Campaigns() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dataError, setDataError] = useState('');
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState(
    `Hi {name}! 😊 We miss you at Bloom Salon, Pune. It's been a while since your last visit. Book your next appointment and treat yourself! Call us at 9800001234 to book. See you soon! 🌸`
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Webhook URL from settings (persisted in localStorage for demo)
  const webhookUrl = localStorage.getItem('retainflow_n8n_webhook') ?? '';

  useEffect(() => {
    fetchAllData().then((result) => {
      setCustomers(result.customers);
      setVisits(result.visits);
      setCampaigns(result.campaigns);
      setDataError(result.error ?? '');
      setLoading(false);
    });
  }, []);

  // Eligible: opted-in AND last visit 30-60 days ago
  const eligibleCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!c.marketing_opt_in) return false;
      const cVisits = visits
        .filter((v) => v.customer_id === c.customer_id)
        .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
      if (!cVisits.length) return false;
      const days = daysSince(cVisits[0].visit_date);
      return days >= 30 && days <= 60;
    });
  }, [customers, visits]);

  const eligibleIds = useMemo(() => new Set(eligibleCustomers.map((c) => c.customer_id)), [eligibleCustomers]);
  const allSelected = eligibleCustomers.length > 0 && selected.size === eligibleCustomers.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligibleCustomers.map((c) => c.customer_id)));
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    setSending(true);
    const recipients = eligibleCustomers
      .filter((c) => selected.has(c.customer_id))
      .map((c) => ({ customer_id: c.customer_id, name: c.name, phone: c.phone }));

    const campaignId = `camp_${Date.now()}`;
    const payload: CampaignPayload = {
      campaign_id: campaignId,
      message_template: message,
      google_review_url: DEFAULT_SETTINGS.google_review_url,
      recipients,
    };

    const result = await sendCampaignViaWebhook(webhookUrl, payload);
    setSending(false);
    setShowConfirm(false);

    if (result.accepted) {
      setSendResult({ success: true, message: `Campaign accepted by n8n. ${result.queued} messages queued.` });
      setSelected(new Set());
    } else {
      setSendResult({ success: false, message: result.error ?? 'Campaign send failed.' });
    }
  };

  const getLastVisit = (customerId: string) => {
    const cVisits = visits
      .filter((v) => v.customer_id === customerId)
      .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
    return cVisits[0];
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Campaigns</h2>
          <p className="text-xs text-gray-500">Re-engage at-risk customers via WhatsApp</p>
        </div>
      </div>

      {dataError && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {dataError}
        </div>
      )}

      {/* n8n not configured notice */}
      {!webhookUrl && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            n8n webhook not configured. Go to <a href="/settings" className="underline font-medium">Settings</a> to add your n8n webhook URL before sending campaigns.
            You can still preview and compose campaigns below.
          </span>
        </div>
      )}

      {/* Send result */}
      {sendResult && (
        <div className={`flex items-start gap-2 p-3 rounded-md text-xs border ${
          sendResult.success
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {sendResult.success
            ? <Check className="w-4 h-4 flex-shrink-0" />
            : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          {sendResult.message}
          <button onClick={() => setSendResult(null)} className="ml-auto text-current hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left: Eligible recipients */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <button
                id="select-all-customers"
                onClick={toggleAll}
                className="text-gray-400 hover:text-green-600 transition-colors"
                aria-label="Select all eligible customers"
                disabled={loading || eligibleCustomers.length === 0}
              >
                {allSelected
                  ? <CheckSquare className="w-4 h-4 text-green-600" />
                  : <Square className="w-4 h-4" />}
              </button>
              <p className="text-sm font-semibold text-gray-900">Eligible Customers</p>
              <span className="badge-yellow">{eligibleCustomers.length}</span>
            </div>
            <p className="text-xs text-gray-400">Opted-in · 30–60 days inactive</p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : eligibleCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No eligible customers right now.</p>
                <p className="text-xs text-gray-300 mt-1">Eligible = opted-in AND last visit 30–60 days ago</p>
              </div>
            ) : (
              <table className="w-full" aria-label="Eligible campaign recipients">
                <thead>
                  <tr className="table-head">
                    <th className="table-cell w-8" />
                    <th className="table-cell text-left font-semibold">Customer</th>
                    <th className="table-cell text-left font-semibold hidden sm:table-cell">Last Service</th>
                    <th className="table-cell text-left font-semibold">Days Since</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleCustomers.map((c) => {
                    const lv = getLastVisit(c.customer_id);
                    const days = lv ? daysSince(lv.visit_date) : 0;
                    const isChecked = selected.has(c.customer_id);
                    return (
                      <tr key={c.customer_id} className="table-row">
                        <td className="table-cell">
                          <button
                            onClick={() => toggle(c.customer_id)}
                            className={`transition-colors ${isChecked ? 'text-green-600' : 'text-gray-300 hover:text-gray-500'}`}
                            aria-label={`Select ${c.name}`}
                          >
                            {isChecked
                              ? <CheckSquare className="w-4 h-4" />
                              : <Square className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="table-cell">
                          <p className="font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.phone}</p>
                        </td>
                        <td className="table-cell text-gray-600 hidden sm:table-cell">
                          {lv?.service ?? '—'}
                        </td>
                        <td className="table-cell">
                          <span className="badge-yellow">{days}d</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Message + preview */}
        <div className="space-y-4">
          {/* Message template */}
          <div className="card p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">Message Template</p>
              <p className="text-xs text-gray-400">Use <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> to personalise.</p>
            </div>
            <textarea
              id="campaign-message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input resize-none text-xs leading-relaxed"
              placeholder="Write your WhatsApp message…"
            />
          </div>

          {/* Preview summary */}
          <div className="card p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-900">Campaign Preview</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Recipients selected</span>
                <span className="font-semibold text-gray-900">{selected.size}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Message length</span>
                <span className={`font-medium ${message.length > 1000 ? 'text-red-500' : 'text-gray-900'}`}>
                  {message.length} chars
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Channel</span>
                <span className="font-medium text-gray-900">WhatsApp via n8n</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>n8n status</span>
                <span className={`font-medium ${webhookUrl ? 'text-green-600' : 'text-amber-500'}`}>
                  {webhookUrl ? 'Configured' : 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Send button */}
          <button
            id="campaign-send-btn"
            onClick={() => setShowConfirm(true)}
            disabled={selected.size === 0 || loading}
            className="btn-primary w-full justify-center"
          >
            <Send className="w-4 h-4" />
            Send to {selected.size} customer{selected.size !== 1 ? 's' : ''}
          </button>
          {selected.size === 0 && (
            <p className="text-xs text-gray-400 text-center">Select at least one recipient to send</p>
          )}
        </div>
      </div>

      {/* Past campaigns */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Past Campaigns</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Past campaigns">
            <thead>
              <tr className="table-head">
                <th className="table-cell text-left font-semibold">Date</th>
                <th className="table-cell text-left font-semibold hidden sm:table-cell">Message</th>
                <th className="table-cell text-left font-semibold">Status</th>
                <th className="table-cell text-left font-semibold">Recipients</th>
                <th className="table-cell text-left font-semibold">Sent</th>
                <th className="table-cell text-left font-semibold">Failed</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp) => (
                <tr key={camp.campaign_id} className="table-row">
                  <td className="table-cell text-gray-600 whitespace-nowrap">
                    {new Date(camp.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="table-cell text-gray-600 hidden sm:table-cell max-w-xs truncate">
                    {(camp.campaign_name || camp.message).substring(0, 60)}…
                  </td>
                  <td className="table-cell">
                    <span className="badge-gray">{camp.status || '—'}</span>
                  </td>
                  <td className="table-cell">
                    {camp.recipient_count ?? 0}
                  </td>
                  <td className="table-cell">
                    <span className="badge-blue">{camp.sent_count ?? 0}</span>
                  </td>
                  <td className="table-cell">
                    <span className={camp.failed_count ? 'badge-red' : 'badge-gray'}>
                      {camp.failed_count ?? 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <ConfirmModal
          recipientCount={selected.size}
          message={message}
          onConfirm={handleSend}
          onCancel={() => setShowConfirm(false)}
          loading={sending}
        />
      )}
    </div>
  );
}
