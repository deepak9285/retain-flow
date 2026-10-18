import ExcelJS from 'exceljs';
import type { Campaign, Customer, Visit } from '../../types';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SPREADSHEET_ID = '1kExnF1oDeZiu97DZxm-5c7_LLnBzzWS7C6GMeHyadfQ';

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const TOKEN_KEY = 'retainflow_google_sheets_token';
const LOCAL_DATA_KEY = 'retainflow_local_sheet_data';
const LOCAL_FILE_KEY = 'retainflow_local_sheet_file';

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
}

interface GoogleAuthError {
  type: string;
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GoogleIdentity {
  accounts: {
    oauth2: {
      initTokenClient: (options: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
        error_callback: (error: GoogleAuthError) => void;
      }) => GoogleTokenClient;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts.oauth2) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    const script = existingScript ?? document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Google sign-in.'));
    if (!existingScript) document.head.appendChild(script);
  });
}

export async function connectGoogleSheet(): Promise<void> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Set VITE_GOOGLE_CLIENT_ID in .env and restart the app.');
  }

  await loadGoogleIdentity();
  return new Promise((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error ?? 'Google authorization failed.'));
          return;
        }
        sessionStorage.setItem(TOKEN_KEY, response.access_token);
        resolve();
      },
      error_callback: (error) => {
        const message = error.type === 'popup_failed_to_open'
          ? 'Google sign-in popup was blocked. Allow pop-ups for this site and try again.'
          : error.type === 'popup_closed'
            ? 'Google sign-in was cancelled before authorization.'
            : `Google sign-in failed: ${error.type}`;
        reject(new Error(message));
      },
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

export function disconnectGoogleSheet(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isGoogleSheetConnected(): boolean {
  return Boolean(sessionStorage.getItem(TOKEN_KEY));
}

async function fetchSheetRange(range: string, token: string): Promise<string[][]> {
  const url = `${SHEETS_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) disconnectGoogleSheet();
    const err = await res.text();
    throw new Error(`Google Sheets API error: ${res.status} — ${err}`);
  }
  const data: { values?: string[][] } = await res.json();
  return data.values ?? [];
}

function records(rows: string[][]): Array<Record<string, string>> {
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  return rows.slice(1).filter((row) => row.some((value) => value.trim())).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() ?? '']))
  );
}

function rowsToCustomers(rows: string[][]): Customer[] {
  return records(rows).map((row) => ({
    customer_id: row.customer_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    marketing_opt_in: ['true', 'yes', 'y', '1'].includes(row.marketing_opt_in?.toLowerCase()),
    created_at: row.first_visit_date || row.created_at || new Date().toISOString(),
  }));
}

function rowsToVisits(rows: string[][]): Visit[] {
  return records(rows).map((row) => {
    const status = row.review_status?.toLowerCase();
    return {
      visit_id: row.visit_id,
      customer_id: row.customer_id,
      service: row.service,
      price: Number.parseFloat(row.price?.replace(/[^\d.-]/g, '') ?? '') || 0,
      visit_date: row.visit_date || new Date().toISOString(),
      review_status: status === 'sent' ? 'requested'
        : status === 'pending' || status === 'received' || status === 'requested'
          ? status
          : 'none',
    };
  });
}

function rowsToCampaigns(rows: string[][]): Campaign[] {
  return records(rows).map((row) => {
    const sent = Number.parseInt(row.sent, 10) || 0;
    const failed = Number.parseInt(row.failed, 10) || 0;
    return {
      campaign_id: row.campaign_id,
      campaign_name: row.campaign_name,
      message: row.message,
      created_at: row.created_at || new Date().toISOString(),
      recipient_count: Number.parseInt(row.recipients, 10) || 0,
      status: row.status,
      sent_count: sent,
      failed_count: failed,
    };
  });
}

export interface DataSourceResult {
  customers: Customer[];
  visits: Visit[];
  campaigns: Campaign[];
  source: 'sheets' | 'local' | 'unconfigured';
  error?: string;
}

interface StoredLocalData {
  customers: Customer[];
  visits: Visit[];
  campaigns: Campaign[];
}

function workbookRows(worksheet: ExcelJS.Worksheet): string[][] {
  const rows: string[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    rows.push(Array.from({ length: row.cellCount }, (_, index) => {
      const cell = row.getCell(index + 1);
      const value = cell.value;
      if (value instanceof Date) return value.toISOString().slice(0, 10);
      if (value && typeof value === 'object' && 'result' in value) {
        return String(value.result ?? '');
      }
      return cell.text.trim();
    }));
  });
  return rows;
}

function getLocalData(): StoredLocalData | null {
  const stored = localStorage.getItem(LOCAL_DATA_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as StoredLocalData;
  } catch {
    localStorage.removeItem(LOCAL_DATA_KEY);
    localStorage.removeItem(LOCAL_FILE_KEY);
    return null;
  }
}

export function getLocalWorkbookName(): string {
  return localStorage.getItem(LOCAL_FILE_KEY) ?? '';
}

export function clearLocalWorkbook(): void {
  localStorage.removeItem(LOCAL_DATA_KEY);
  localStorage.removeItem(LOCAL_FILE_KEY);
}

export async function importLocalWorkbook(file: File): Promise<StoredLocalData> {
  if (!/\.xlsx$/i.test(file.name)) {
    throw new Error('Choose an Excel workbook (.xlsx).');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const getRows = (name: string) => {
    const worksheet = workbook.worksheets.find(
      (sheet) => sheet.name.trim().toLowerCase() === name.toLowerCase()
    );
    return worksheet ? workbookRows(worksheet) : [];
  };
  const customerRows = getRows('Customers');
  const visitRows = getRows('Visits');
  if (!customerRows.length || !visitRows.length) {
    throw new Error('Workbook must include Customers and Visits tabs with a header row.');
  }

  const data: StoredLocalData = {
    customers: rowsToCustomers(customerRows),
    visits: rowsToVisits(visitRows),
    campaigns: rowsToCampaigns(getRows('Campaigns')),
  };
  if (!data.customers.length || !data.visits.length) {
    throw new Error('Customers and Visits tabs must each contain at least one data row.');
  }

  localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data));
  localStorage.setItem(LOCAL_FILE_KEY, file.name);
  return data;
}

export async function fetchAllData(): Promise<DataSourceResult> {
  const localData = getLocalData();
  if (localData) return { ...localData, source: 'local' };

  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    return {
      customers: [], visits: [], campaigns: [], source: 'unconfigured',
      error: 'Import an Excel workbook or connect your Google account in Settings to load data.',
    };
  }

  try {
    const [customerRows, visitRows, campaignRows] = await Promise.all([
      fetchSheetRange('Customers!A:Z', token),
      fetchSheetRange('Visits!A:Z', token),
      fetchSheetRange('Campaigns!A:Z', token),
    ]);
    return {
      customers: rowsToCustomers(customerRows),
      visits: rowsToVisits(visitRows),
      campaigns: rowsToCampaigns(campaignRows),
      source: 'sheets',
    };
  } catch (err) {
    console.error('[RetainFlow] Google Sheets fetch failed:', err);
    return {
      customers: [],
      visits: [],
      campaigns: [],
      source: 'unconfigured',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
