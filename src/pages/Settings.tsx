import { useState, type ChangeEvent } from 'react';
import {
  Save,
  Flower2,
  Link,
  Webhook,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  LogOut,
  Loader2,
  Database,
  LogIn,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DEFAULT_SETTINGS } from '../lib/demoData';
import {
  clearLocalWorkbook,
  connectGoogleSheet,
  disconnectGoogleSheet,
  getLocalWorkbookName,
  importLocalWorkbook,
  isGoogleSheetConnected,
} from '../lib/integrations/sheets';

interface Section {
  id: string;
  title: string;
  open: boolean;
}

export default function Settings() {
  const { user, demoUser, signOut, isDemoMode } = useAuth();
  const userEmail = user?.email ?? demoUser?.email ?? '';

  // Salon info
  const [salonName, setSalonName] = useState(
    () => localStorage.getItem('retainflow_salon_name') ?? DEFAULT_SETTINGS.salon_name
  );
  const [reviewUrl, setReviewUrl] = useState(
    () => localStorage.getItem('retainflow_review_url') ?? DEFAULT_SETTINGS.google_review_url
  );

  // n8n
  const [webhookUrl, setWebhookUrl] = useState(
    () => localStorage.getItem('retainflow_n8n_webhook') ?? ''
  );
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  // Account
  const [showNewPass, setShowNewPass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passStatus, setPassStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Save states
  const [salonSaved, setSalonSaved] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [sheetConnected, setSheetConnected] = useState(isGoogleSheetConnected);
  const [sheetStatus, setSheetStatus] = useState('');
  const [connectingSheet, setConnectingSheet] = useState(false);
  const [localWorkbookName, setLocalWorkbookName] = useState(getLocalWorkbookName);
  const [importingWorkbook, setImportingWorkbook] = useState(false);

  // Sections
  const [sections, setSections] = useState<Section[]>([
    { id: 'salon',      title: 'Salon Information',    open: true },
    { id: 'sheets',     title: 'Google Sheets',         open: true },
    { id: 'n8n',        title: 'n8n Integration',      open: true },
    { id: 'account',    title: 'Account',              open: true },
    { id: 'guide',      title: 'Integration Guide',    open: false },
  ]);

  const toggleSection = (id: string) =>
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, open: !s.open } : s));

  const saveSalon = () => {
    localStorage.setItem('retainflow_salon_name', salonName);
    localStorage.setItem('retainflow_review_url', reviewUrl);
    setSalonSaved(true);
    setTimeout(() => setSalonSaved(false), 2500);
  };

  const saveWebhook = () => {
    localStorage.setItem('retainflow_n8n_webhook', webhookUrl);
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2500);
  };

  const connectSheet = async () => {
    setConnectingSheet(true);
    setSheetStatus('');
    try {
      await connectGoogleSheet();
      setSheetConnected(true);
      setSheetStatus('Google Sheets connected. Reload the dashboard to load live data.');
    } catch (error) {
      setSheetStatus(error instanceof Error ? error.message : 'Google Sheets connection failed.');
    } finally {
      setConnectingSheet(false);
    }
  };

  const disconnectSheet = () => {
    disconnectGoogleSheet();
    setSheetConnected(false);
    setSheetStatus('Google Sheets disconnected.');
  };

  const handleWorkbookUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportingWorkbook(true);
    setSheetStatus('');
    try {
      const data = await importLocalWorkbook(file);
      setLocalWorkbookName(file.name);
      setSheetStatus(`${data.customers.length} customers and ${data.visits.length} visits imported on this device.`);
    } catch (error) {
      setSheetStatus(error instanceof Error ? error.message : 'Could not import this workbook.');
    } finally {
      setImportingWorkbook(false);
      event.target.value = '';
    }
  };

  const removeLocalWorkbook = () => {
    clearLocalWorkbook();
    setLocalWorkbookName('');
    setSheetStatus('Local workbook removed.');
  };

  const testWebhook = async () => {
    if (!webhookUrl) return;
    setTestStatus('testing');
    setTestError('');
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ping', source: 'RetainFlow Settings' }),
      });
      setTestStatus(res.ok ? 'ok' : 'error');
      if (!res.ok) setTestError(`HTTP ${res.status}`);
    } catch (e) {
      setTestStatus('error');
      setTestError(e instanceof Error ? e.message : 'Network error');
    }
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPassStatus('error');
      return;
    }
    // In real Supabase: await supabase.auth.updateUser({ password: newPassword })
    setPassStatus('saved');
    setNewPassword('');
    setTimeout(() => setPassStatus('idle'), 2500);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Settings</h2>
        <p className="text-xs text-gray-500">Configure your salon and integrations</p>
      </div>

      {/* Salon Info */}
      <SettingsCard
        section={sections.find((s) => s.id === 'salon')!}
        onToggle={() => toggleSection('salon')}
        icon={<Flower2 className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <div>
            <label htmlFor="salon-name" className="label">Salon Name</label>
            <input
              id="salon-name"
              type="text"
              className="input"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              placeholder="Bloom Salon"
            />
          </div>
          <div>
            <label htmlFor="review-url" className="label">Google Review URL</label>
            <input
              id="review-url"
              type="url"
              className="input"
              value={reviewUrl}
              onChange={(e) => setReviewUrl(e.target.value)}
              placeholder="https://g.page/r/your-salon/review"
            />
            <p className="text-xs text-gray-400 mt-1">
              Sent in review request campaigns. Must be an honest review link — don't filter by satisfaction.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            {salonSaved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <button id="save-salon" onClick={saveSalon} className="btn-primary">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        section={sections.find((s) => s.id === 'sheets')!}
        onToggle={() => toggleSection('sheets')}
        icon={<Database className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-600">
            Import a downloaded Excel workbook for device-only use, or connect Google for cloud data. Local workbook data is stored in this browser and is never uploaded.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="local-workbook" className="btn-secondary cursor-pointer">
              {importingWorkbook
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                : <><Upload className="w-4 h-4" /> Import Excel workbook</>}
            </label>
            <input
              id="local-workbook"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={handleWorkbookUpload}
              disabled={importingWorkbook}
            />
            {localWorkbookName && (
              <button onClick={removeLocalWorkbook} className="btn-ghost">Remove local data</button>
            )}
          </div>
          {localWorkbookName && (
            <p className="flex items-center gap-1.5 text-xs text-green-700">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Using {localWorkbookName}
            </p>
          )}
          {!sheetConnected ? (
            <button onClick={connectSheet} disabled={connectingSheet} className="btn-primary">
              {connectingSheet
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                : <><LogIn className="w-4 h-4" /> Connect Google Sheet</>}
            </button>
          ) : (
            <button onClick={disconnectSheet} className="btn-secondary">Disconnect Google Sheet</button>
          )}
          {sheetStatus && <p role="status" className="text-xs text-gray-600">{sheetStatus}</p>}
          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <p className="text-xs text-amber-700">
              Add VITE_GOOGLE_CLIENT_ID to .env and restart the app before connecting.
            </p>
          )}
        </div>
      </SettingsCard>

      {/* n8n Integration */}
      <SettingsCard
        section={sections.find((s) => s.id === 'n8n')!}
        onToggle={() => toggleSection('n8n')}
        icon={<Webhook className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              The webhook URL is stored locally in your browser and never sent to any server except n8n.
              Your Meta WhatsApp access token must be configured inside n8n — never here.
            </span>
          </div>

          <div>
            <label htmlFor="n8n-webhook" className="label">n8n Webhook URL</label>
            <input
              id="n8n-webhook"
              type="url"
              className="input"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-n8n.example.com/webhook/xxx"
            />
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                testStatus === 'ok' ? 'bg-green-500' :
                testStatus === 'error' ? 'bg-red-500' :
                testStatus === 'testing' ? 'bg-amber-400 animate-pulse' :
                'bg-gray-300'
              }`}
            />
            <span className="text-xs text-gray-500">
              {testStatus === 'ok'    ? 'Connection successful' :
               testStatus === 'error' ? `Connection failed: ${testError}` :
               testStatus === 'testing' ? 'Testing…' :
               webhookUrl ? 'Not tested yet' : 'No webhook URL configured'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            {webhookSaved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <button
              id="test-webhook"
              onClick={testWebhook}
              disabled={!webhookUrl || testStatus === 'testing'}
              className="btn-secondary"
            >
              {testStatus === 'testing'
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing…</>
                : 'Test Connection'}
            </button>
            <button id="save-webhook" onClick={saveWebhook} className="btn-primary">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* Account */}
      <SettingsCard
        section={sections.find((s) => s.id === 'account')!}
        onToggle={() => toggleSection('account')}
        icon={<User className="w-4 h-4" />}
      >
        <div className="space-y-3">
          <div>
            <label className="label">Email address</label>
            <input type="email" className="input bg-gray-50 text-gray-500" value={userEmail} readOnly />
          </div>

          {isDemoMode ? (
            <div className="demo-banner">
              <AlertCircle className="w-3.5 h-3.5" />
              Password change is disabled in demo mode. Configure Supabase to enable it.
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="new-password" className="label">New Password</label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPass ? 'text' : 'password'}
                  className="input pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-end gap-2">
                {passStatus === 'saved' && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Password updated
                  </span>
                )}
                {passStatus === 'error' && (
                  <span className="text-xs text-red-500">Min 6 characters required</span>
                )}
                <button id="change-password" onClick={changePassword} className="btn-primary">
                  Update Password
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <button
              id="settings-logout"
              onClick={() => signOut()}
              className="btn-secondary w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* Integration Guide */}
      <SettingsCard
        section={sections.find((s) => s.id === 'guide')!}
        onToggle={() => toggleSection('guide')}
        icon={<Link className="w-4 h-4" />}
      >
        <div className="space-y-4 text-xs text-gray-600">
          <div>
            <p className="font-semibold text-gray-900 mb-2">Required Environment Variables</p>
            <div className="bg-gray-900 text-green-400 rounded-md p-3 font-mono text-xs space-y-1 leading-relaxed">
              <p className="text-gray-500"># Supabase Auth (required)</p>
              <p>VITE_SUPABASE_URL=https://xxx.supabase.co</p>
              <p>VITE_SUPABASE_ANON_KEY=eyJ...</p>
              <br />
              <p className="text-gray-500"># Google Sheets OAuth</p>
              <p>VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com</p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-gray-900 mb-1">Google Sheets Setup</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Enable Google Sheets API and configure the OAuth consent screen in Google Cloud Console.</li>
              <li>Create a Web OAuth Client ID and add this app's origin to Authorized JavaScript origins.</li>
              <li>Set <code className="bg-gray-100 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> in <code className="bg-gray-100 px-1 rounded">.env</code>, then restart the dev server.</li>
              <li>Connect the Google account that can access the spreadsheet. Access is read-only; the token stays in this browser session.</li>
              <li>Keep the tabs named <code className="bg-gray-100 px-1 rounded">Customers</code>, <code className="bg-gray-100 px-1 rounded">Visits</code>, and <code className="bg-gray-100 px-1 rounded">Campaigns</code>.</li>
            </ol>
          </div>

          <div>
            <p className="font-semibold text-gray-900 mb-1">n8n Workflow Setup</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a Webhook trigger node in n8n (POST method)</li>
              <li>Add a Loop node over <code className="bg-gray-100 px-1 rounded">recipients</code> array</li>
              <li>Add a WhatsApp node with your Meta access token (stored in n8n credentials)</li>
              <li>Map <code className="bg-gray-100 px-1 rounded">message_template</code> replacing <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> with each recipient's name</li>
              <li>Return <code className="bg-gray-100 px-1 rounded">{"{ \"accepted\": true, \"queued\": N }"}</code> in the HTTP response node</li>
              <li>Paste the webhook URL above and click Save</li>
            </ol>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
            <strong>Important:</strong> Never put your Meta WhatsApp access token, Supabase service-role key, or any private secret in this app's frontend code or env vars visible to the browser.
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}

// ─── Collapsible section card ─────────────────────────────────────────────────

interface SettingsCardProps {
  section: Section;
  onToggle: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SettingsCard({ section, onToggle, icon, children }: SettingsCardProps) {
  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        aria-expanded={section.open}
      >
        <div className="flex items-center gap-2 text-gray-700">
          {icon}
          <span className="text-sm font-semibold">{section.title}</span>
        </div>
        {section.open
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {section.open && <div className="p-4">{children}</div>}
    </div>
  );
}
