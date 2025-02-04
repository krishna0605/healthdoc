import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface SetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  isEnabled: boolean;
  setupComplete: boolean;
}

export function useTwoFactor() {
  const [status, setStatus] = useState<TwoFactorStatus>({ isEnabled: false, setupComplete: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.get<TwoFactorStatus>('/api/auth/2fa/status');
    if (error) {
      setError(error);
    } else if (data) {
      setStatus(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const setup2FA = async (): Promise<SetupData | null> => {
    setLoading(true);
    const { data, error } = await api.post<SetupData>('/api/auth/2fa/setup', {});
    setLoading(false);
    
    if (error) {
      setError(error);
      return null;
    }
    return data;
  };

  const verify2FA = async (code: string): Promise<boolean> => {
    setLoading(true);
    const { error } = await api.post('/api/auth/2fa/verify', { code });
    setLoading(false);

    if (error) {
      setError(error);
      return false;
    }
    
    await fetchStatus();
    return true;
  };

  const validate2FA = async (code: string, isBackupCode?: boolean): Promise<boolean> => {
    setLoading(true);
    const { error } = await api.post('/api/auth/2fa/validate', { code, isBackupCode });
    setLoading(false);

    if (error) {
      setError(error);
      return false;
    }
    return true;
  };

  const disable2FA = async (code: string): Promise<boolean> => {
    setLoading(true);
    const { error } = await api.post('/api/auth/2fa/disable', { code });
    setLoading(false);

    if (error) {
      setError(error);
      return false;
    }

    await fetchStatus();
    return true;
  };

  const regenerateBackupCodes = async (code: string): Promise<string[] | null> => {
    setLoading(true);
    const { data, error } = await api.post<{ backupCodes: string[] }>('/api/auth/2fa/backup-codes', { code });
    setLoading(false);

    if (error) {
      setError(error);
      return null;
    }
    return data?.backupCodes || null;
  };

  return {
    status,
    loading,
    error,
    setup2FA,
    verify2FA,
    validate2FA,
    disable2FA,
    regenerateBackupCodes,
    refreshStatus: fetchStatus
  };
}
