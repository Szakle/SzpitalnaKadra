import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
});

export interface PersonReportItem {
  id: number;
  pesel: string;
  imie: string;
  nazwisko: string;
  nrPwz?: string;
  typPersoneluId: number;
}

export interface ErrorReportItem {
  pesel: string;
  imie: string;
  nazwisko: string;
  error: string;
}

export interface ImportReport {
  id: string;
  timestamp: string;
  addedCount: number;
  updatedCount: number;
  errorCount: number;
  totalProcessed: number;
  addedPersons: PersonReportItem[];
  updatedPersons: PersonReportItem[];
  errorPersons: ErrorReportItem[];
}

export interface ImportReportSummary {
  id: string;
  timestamp: string;
  addedCount: number;
  updatedCount: number;
  totalProcessed: number;
  fileName: string;
}

// Two-Factor Authentication
export interface TwoFactorStatus {
  totpEnabled: boolean;
  hasSecret: boolean;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUri: string;
  manualEntryKey: string;
  message: string;
}

export const getTwoFactorStatus = async (userId: number): Promise<TwoFactorStatus> => {
  const response = await api.get(`/api/TwoFactor/status/${userId}`);
  return response.data;
};

export const setupTwoFactor = async (userId: number): Promise<TwoFactorSetupResponse> => {
  const response = await api.post(`/api/TwoFactor/setup/${userId}`);
  return response.data;
};

export const verifyTwoFactor = async (userId: number, code: string): Promise<void> => {
  await api.post(`/api/TwoFactor/verify/${userId}`, { code });
};

export const disableTwoFactor = async (userId: number, code: string): Promise<void> => {
  await api.post(`/api/TwoFactor/disable/${userId}`, { code });
};

export const runScraper = async (): Promise<ImportReport> => {
  const response = await api.post('/api/Scraper/run');
  return response.data;
};

export const getReportsHistory = async (): Promise<ImportReportSummary[]> => {
  const response = await api.get('/api/Scraper/reports');
  return response.data;
};

export const getReportById = async (id: string): Promise<ImportReport> => {
  const response = await api.get(`/api/Scraper/reports/${id}`);
  return response.data;
};

// SZOI Settings
export interface SzoiSettings {
  szoiUrl: string;
  recordLimit: number | null;
  fetchAll: boolean;
}

export const getSzoiSettings = async (): Promise<SzoiSettings> => {
  const response = await api.get('/api/Scraper/settings');
  return response.data;
};

export const saveSzoiSettings = async (settings: SzoiSettings): Promise<void> => {
  await api.post('/api/Scraper/settings', settings);
};

export default api;