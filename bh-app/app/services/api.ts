// app/services/api.ts
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useMemo } from 'react'; // Import useCallback and useMemo

const API_BASE_URL = 'https://user-server-bh-168223699989.us-central1.run.app';

export const useApi = () => {
  const { getToken } = useAuth();

  const authFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = await getToken(); // getToken from useAuth is generally stable
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
      // Check if response is empty before trying to parse JSON
      const text = await response.text();
      return text ? JSON.parse(text) : {}; // Return empty object or handle as appropriate if empty response is valid
    } catch (error) {
      console.error('Error in authFetch:', error);
      throw error;
    }
  }, [getToken]); // getToken is the primary dependency here

  const getUserData = useCallback(async () => {
    return authFetch('/users/me');
  }, [authFetch]);

  const getUserDevices = useCallback(async (ownerId: string | number) => {
    return authFetch(`/devices/user/${ownerId}`);
  }, [authFetch]);

  const getDeviceReadings = useCallback(async (deviceId: string | number, limit: number = 120) => {
    return authFetch(`/devices/${deviceId}/readings/latest?limit=${limit}`);
  }, [authFetch]);

  // Memoize the returned object so its reference is stable
  // as long as its constituent functions are stable.
  return useMemo(() => ({
    getUserData,
    getUserDevices,
    getDeviceReadings,
  }), [getUserData, getUserDevices, getDeviceReadings]);
};

export default useApi;
