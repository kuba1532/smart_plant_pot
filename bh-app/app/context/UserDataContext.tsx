// app/context/UserDataContext.tsx
import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useApi } from '../services/api';

// Define an interface for the device structure based on the API response
export interface Device {
  unique_key: string;
  name: string;
  type_code: string;
  id: number; // This is device_db_id
  owner_id: number; // This is user's internal DB ID
  created_at: string;
}

interface UserDataContextType {
  userData: any | null;
  isLoading: boolean; // For user data
  error: string | null; // For user data
  fetchUserData: () => Promise<void>;
  clearUserData: () => void;

  devicesData: Device[] | null;
  isDevicesLoading: boolean;
  devicesError: string | null;
  fetchUserDevices: (ownerId: string | number) => Promise<void>;
  clearDevicesData: () => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn, userId } = useAuth();
  const api = useApi(); // Assuming useApi is memoized as per previous fix

  const [devicesData, setDevicesData] = useState<Device[] | null>(null);
  const [isDevicesLoading, setIsDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);

  const isFetchingUserRef = useRef(false);
  const isFetchingDevicesRef = useRef(false);
  const lastFetchedOwnerIdForDevicesRef = useRef<string | number | null>(null); // Added Ref

  const clearUserData = useCallback(() => {
    setUserData(null);
    setError(null);
    setIsLoading(false);
    console.log('UserDataContext: User data cleared.');
  }, []);

  const clearDevicesData = useCallback(() => {
    setDevicesData(null);
    setDevicesError(null);
    setIsDevicesLoading(false);
    lastFetchedOwnerIdForDevicesRef.current = null; // Reset on clear
    console.log('UserDataContext: Devices data cleared.');
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!isSignedIn || !userId || isFetchingUserRef.current) return;
    console.log('UserDataContext: Attempting to fetch user data...');
    isFetchingUserRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getUserData();
      setUserData(data);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Failed to load user data: ${errorMessage}`);
      setUserData(null);
    } finally {
      setIsLoading(false);
      isFetchingUserRef.current = false;
    }
  }, [api, isSignedIn, userId]);

  const fetchUserDevices = useCallback(async (ownerId: string | number) => {
    if (!isSignedIn || isFetchingDevicesRef.current) return;
    console.log(`UserDataContext: Attempting to fetch devices for owner ID: ${ownerId}...`);
    isFetchingDevicesRef.current = true;
    setIsDevicesLoading(true);
    setDevicesError(null);
    try {
      const data = await api.getUserDevices(ownerId);
      setDevicesData(data);
      lastFetchedOwnerIdForDevicesRef.current = ownerId; // Mark as fetched for this ownerId
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setDevicesError(`Failed to load devices: ${errorMessage}`);
      setDevicesData(null);
      // Potentially reset lastFetchedOwnerIdForDevicesRef.current if fetch fails and you want to retry on next userData change?
      // For now, let's assume a failed fetch means we don't want to immediately retry without user action or state change.
    } finally {
      setIsDevicesLoading(false);
      isFetchingDevicesRef.current = false;
    }
  }, [api, isSignedIn]);

  // Effect to fetch user data when auth state changes
  useEffect(() => {
    if (isSignedIn && userId) {
      if (!userData || (userData && userData.clerk_id !== userId)) {
        fetchUserData();
      }
    } else {
      if (userData !== null) clearUserData();
      if (devicesData !== null) clearDevicesData(); // This will also reset lastFetchedOwnerIdForDevicesRef
    }
  }, [isSignedIn, userId, userData, fetchUserData, clearUserData, devicesData, clearDevicesData]);


  // Effect to fetch devices data when userData.id becomes available or changes
  useEffect(() => {
    console.log(`UserDataContext: Devices Effect Triggered. isSignedIn: ${isSignedIn}, userData.id: ${userData?.id}, lastFetchedOwnerId: ${lastFetchedOwnerIdForDevicesRef.current}`);
    if (isSignedIn && userData && userData.id) {
      // Fetch devices if the current userData.id is different from the one we last fetched devices for.
      if (lastFetchedOwnerIdForDevicesRef.current !== userData.id) {
        console.log(`UserDataContext: Devices Effect: Owner ID changed to ${userData.id} or first fetch. Fetching devices.`);
        fetchUserDevices(userData.id);
      } else {
        console.log(`UserDataContext: Devices Effect: Devices already processed for ownerId: ${userData.id}`);
      }
    } else if (!isSignedIn) {
      // If signed out, ensure devices data and tracking ref are cleared (clearDevicesData handles this)
      // This case is mostly handled by clearDevicesData in the Auth effect, but defensive check here is fine.
      if (devicesData !== null || lastFetchedOwnerIdForDevicesRef.current !== null) {
        console.log('UserDataContext: Devices Effect: Signed out, ensuring devices data and ref are cleared.');
        clearDevicesData(); // This will set devicesData to null and lastFetchedOwnerIdForDevicesRef to null
      }
    }
    // This effect now primarily reacts to changes in `isSignedIn` and `userData` (specifically `userData.id`).
    // `fetchUserDevices` and `clearDevicesData` are stable callbacks.
    // `devicesData` is NOT a dependency here, so `setDevicesData` won't re-trigger this effect directly.
  }, [isSignedIn, userData, fetchUserDevices, clearDevicesData]); // Removed devicesData

  return (
      <UserDataContext.Provider value={{ userData, isLoading, error, fetchUserData, clearUserData, devicesData, isDevicesLoading, devicesError, fetchUserDevices, clearDevicesData }}>
        {children}
      </UserDataContext.Provider>
  );
};

export const useUserDataContext = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserDataContext must be used within a UserDataProvider');
  }
  return context;
};
