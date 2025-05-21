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
      // Get the JWT token from Clerk
      const token = await getToken();
      
      console.log('Auth token available:', !!token); // Log token availability
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Add authorization header with the token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };
      
      console.log(`Making request to ${API_BASE_URL}${endpoint}`);
      
      // Make the request
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
      
      console.log('Response status:', response.status);
      
      // Check if the request was successful
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
      console.log('API response data:', data);
      return data;
    } catch (error) {
      console.error('Error in authFetch:', error);
      throw error;
    }
  };
  
  // Specific API methods
  const getUserData = async () => {
    try {
      return await authFetch('/protected');
    } catch (error) {
      console.error('Error in getUserData:', error);
      throw error;
    }
  };
  
  return {
    getUserData,
  };
};

export default useApi;
