// app/services/api.ts
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useMemo } from 'react';

const API_BASE_URL = 'https://user-server-bh-168223699989.us-central1.run.app';

// Add interfaces for request bodies and responses based on openapi.json
export interface ChangeSettingsPayload {
  maxHumidity: number,
  minHumidity: number,
  maxBrightness: number,
  minBrightness: number,
  brightPeriodStart: string,
  brightPeriodEnd: string,
  deviceId: number
}

export interface SendCommandPayload {
  waterFor: string,
  illuminateFor: string,
  deviceId: number
}

export interface ActionResponse {
  device_unique_key: string;
  status: string;
  message?: string;
  settings?: object; // For ChangeSettingsOutput
  command?: string;  // For SendCommandOutput
}


export const useApi = () => {
  const { getToken } = useAuth();

  const authFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        console.error('API error response:', errorData);
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch (error) {
      console.error('Error in authFetch:', error);
      throw error;
    }
  }, [getToken]);

  const getUserData = useCallback(async () => {
    return authFetch('/users/me');
  }, [authFetch]);

  const getUserDevices = useCallback(async (ownerId: string | number) => {
    return authFetch(`/devices/user/${ownerId}`);
  }, [authFetch]);

  const getDeviceReadings = useCallback(async (deviceId: string | number, limit: number = 120) => {
    return authFetch(`/devices/${deviceId}/readings/latest?limit=${limit}`);
  }, [authFetch]);

  const changeDeviceSettings = useCallback(async (payload: ChangeSettingsPayload): Promise<ActionResponse> => {
    return authFetch(`/actions/change-settings`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }, [authFetch]);

  const sendDeviceCommand = useCallback(async (payload: SendCommandPayload): Promise<ActionResponse> => {
    return authFetch(`/actions/send-command`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }, [authFetch]);

  return useMemo(() => ({
    getUserData,
    getUserDevices,
    getDeviceReadings,
    changeDeviceSettings,
    sendDeviceCommand,
  }), [getUserData, getUserDevices, getDeviceReadings, changeDeviceSettings, sendDeviceCommand]);
};

export default useApi;
