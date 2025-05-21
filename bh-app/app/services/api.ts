// app/services/api.ts
import { useAuth } from '@clerk/clerk-expo';

// Base API configuration
const API_BASE_URL = 'https://user-server-bh-168223699989.us-central1.run.app'; // Replace with your actual API URL

// Custom hook for making authenticated API requests
export const useApi = () => {
  const { getToken } = useAuth();

  // Generic fetch function that adds authentication
  const authFetch = async (endpoint: string, options: RequestInit = {}) => {
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
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in authFetch:', error);
      throw error;
    }
  };

  // Specific API methods
  const getUserData = async () => {
    try {
      return await authFetch('/users/me');
    } catch (error) {
      console.error('Error in getUserData:', error);
      throw error;
    }
  };

  const getUserDevices = async (ownerId: string | number) => {
    try {
      return await authFetch(`/devices/user/${ownerId}`);
    } catch (error) {
      console.error(`Error in getUserDevices for owner ${ownerId}:`, error);
      throw error;
    }
  };

  const getDeviceReadings = async (deviceId: string | number, limit: number = 120) => {
    try {
      return await authFetch(`/devices/${deviceId}/readings/latest?limit=${limit}`);
    } catch (error) {
      console.error(`Error in getDeviceReadings for device ${deviceId}:`, error);
      throw error;
    }
  };

  return {
    getUserData,
    getUserDevices,
    getDeviceReadings,
    // getDeviceDetails removed
  };
};

export default useApi;
