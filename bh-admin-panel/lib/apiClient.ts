// lib/apiClient.ts

// Use an environment variable for the base URL
// Ensure you have NEXT_PUBLIC_API_URL set in your .env.local file
// e.g., NEXT_PUBLIC_API_URL=http://localhost:8000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL && process.env.NODE_ENV !== 'test') {
  console.warn(
      "WARNING: NEXT_PUBLIC_API_URL is not set. API calls will likely fail. " +
      "Please set this environment variable in your .env.local file (e.g., NEXT_PUBLIC_API_URL=http://your-backend-url.com)."
  );
}

// Interface for the device structure returned by the API
export interface Device {
  id: string; // This is the database primary key for the device
  unique_key: string; // This is the unique_key/hardware_id
  name: string;
  type_code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  // Add any other relevant fields from your DeviceResponse schema
}

// Interface for creating a new device
export interface DeviceCreatePayload {
  unique_key: string;
  name: string;
  type_code: string;
  // Add other required fields for DeviceCreate schema if any
}

// Interface for updating an existing device
// Based on OpenAPI, name, type_code, and unique_key are updatable.
export interface DeviceUpdatePayload {
  name?: string;
  type_code?: string;
  unique_key?: string;
}

async function fetchFromApiClient(token: string, endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers);
  headers.append('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.append('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL || ''}${endpoint}`, { // Added || '' to prevent "undefined/devices" if URL is not set
    ...options,
    headers,
  });

  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({ detail: "Forbidden - You do not have permission to perform this action." }));
    const error = new Error(errorData.detail) as any;
    error.status = 403;
    error.data = errorData;
    throw error;
  }
  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({ detail: "Unauthorized - Please sign in again." }));
    const error = new Error(errorData.detail) as any;
    error.status = 401;
    error.data = errorData;
    throw error;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: `API request failed with status ${response.status}` }));
    const error = new Error(errorData.detail) as any;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  if (response.status === 204) { // No Content
    return null;
  }
  return response.json();
}

export const getDevices = (token: string): Promise<Device[]> =>
    fetchFromApiClient(token, '/devices');

export const registerDevice = (token: string, ownerId: number, deviceData: DeviceCreatePayload): Promise<Device> => // Assuming API returns the created device
    fetchFromApiClient(token, `/devices?owner_id=${ownerId}`, {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });

export const deregisterDevice = (token: string, deviceDbId: string): Promise<null> => // Assuming API returns 204 No Content
    fetchFromApiClient(token, `/devices/${deviceDbId}`, {
      method: 'DELETE',
    });

// New function to update a device
export const updateDevice = (token: string, deviceDbId: string, payload: DeviceUpdatePayload): Promise<Device> =>
    fetchFromApiClient(token, `/devices/${deviceDbId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
