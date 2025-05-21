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
  const api = useApi();

  const [devicesData, setDevicesData] = useState<Device[] | null>(null);
  const [isDevicesLoading, setIsDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);

  const isFetchingUserRef = useRef(false);
  const isFetchingDevicesRef = useRef(false);

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
    console.log('UserDataContext: Devices data cleared.');
  }, []);

  const fetchUserData = useCallback(async () => {
    // Guard against fetching if not signed in, though useEffect primarily handles this.
    if (!isSignedIn || !userId) {
      console.log('UserDataContext: fetchUserData skipped (not signed in or no userId).');
      return;
    }
    if (isFetchingUserRef.current) {
      console.log('UserDataContext: Fetch user data already in progress, skipping.');
      return;
    }

    console.log('UserDataContext: Attempting to fetch user data...');
    isFetchingUserRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getUserData();
      console.log('UserDataContext: User data fetched successfully:', JSON.stringify(data));
      setUserData(data);
    } catch (e) {
      console.error('UserDataContext: Error fetching user data:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Failed to load user data: ${errorMessage}`);
      setUserData(null); // Clear data on error
    } finally {
      setIsLoading(false);
      isFetchingUserRef.current = false;
    }
    // Dependencies: `api` for the call. `isSignedIn` and `userId` to ensure the function has the latest context if called directly.
    // State setters (setUserData, setIsLoading, setError) are stable and don't need to be dependencies.
    // REMOVED: userData, devicesData, clearUserData, clearDevicesData from here to break the loop.
  }, [api, isSignedIn, userId]);

  const fetchUserDevices = useCallback(async (ownerId: string | number) => {
    if (!isSignedIn) {
      console.log('UserDataContext: fetchUserDevices skipped (not signed in).');
      return;
    }
    if (isFetchingDevicesRef.current) {
      console.log('UserDataContext: Devices fetch already in progress, skipping.');
      return;
    }
    console.log(`UserDataContext: Attempting to fetch devices for owner ID: ${ownerId}...`);
    isFetchingDevicesRef.current = true;
    setIsDevicesLoading(true);
    setDevicesError(null);

    try {
      const data = await api.getUserDevices(ownerId);
      console.log('UserDataContext: Devices data fetched successfully:', JSON.stringify(data));
      setDevicesData(data);
    } catch (e) {
      console.error('UserDataContext: Error fetching devices data:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setDevicesError(`Failed to load devices: ${errorMessage}`);
      setDevicesData(null);
    } finally {
      setIsDevicesLoading(false);
      isFetchingDevicesRef.current = false;
    }
    // Dependencies: `api` for the call, `isSignedIn` for the guard.
    // REMOVED: devicesData, clearDevicesData
  }, [api, isSignedIn]);

  // Effect to fetch data when auth state changes
  useEffect(() => {
    console.log(`UserDataContext: Auth Effect Triggered. isSignedIn: ${isSignedIn}, userId: ${userId}, userData clerk_id: ${userData ? userData.clerk_id : 'null'}`);
    if (isSignedIn && userId) {
      // Fetch if no user data OR if the clerk_id of existing user data doesn't match current userId
      if (!userData || (userData && userData.clerk_id !== userId)) {
        console.log('UserDataContext: Auth Effect: Conditions met to fetch user data.');
        fetchUserData();
      } else {
        console.log('UserDataContext: Auth Effect: User data is current for this user.');
      }
    } else {
      // User is signed out or userId not yet available
      if (userData !== null) {
        console.log('UserDataContext: Auth Effect: Signed out or no userId, clearing user data.');
        clearUserData();
      }
      if (devicesData !== null) { // Also clear devices data if user signs out
        console.log('UserDataContext: Auth Effect: Signed out or no userId, clearing devices data.');
        clearDevicesData();
      }
    }
    // `userData` is in dependency array: if `fetchUserData` sets it, this effect re-runs.
    // The internal condition `!userData || (userData.clerk_id !== userId)` prevents infinite refetching.
    // `fetchUserData`, `clearUserData`, `clearDevicesData` are stable callbacks now due to corrected dependencies.
  }, [isSignedIn, userId, userData, fetchUserData, clearUserData, clearDevicesData, devicesData]);

  // Effect to fetch devices data when userData.id becomes available or changes
  useEffect(() => {
    console.log(`UserDataContext: Devices Effect Triggered. isSignedIn: ${isSignedIn}, userData.id: ${userData ? userData.id : 'null'}, devicesData exists: ${!!devicesData}`);
    if (isSignedIn && userData && userData.id) {
      // Fetch devices if they haven't been fetched yet for this user,
      // or if the owner_id in the current devicesData doesn't match userData.id (user changed),
      // or if devicesData is currently an empty array (user might have added their first device).
      if (devicesData === null ||
          (Array.isArray(devicesData) && devicesData.length === 0 && (!devicesData[0] || devicesData[0].owner_id !== userData.id)) || // fetch if empty array AND not already for this user
          (Array.isArray(devicesData) && devicesData.length > 0 && devicesData[0].owner_id !== userData.id)
      ) {
        console.log(`UserDataContext: Devices Effect: User data available (owner_id: ${userData.id}), fetching/refreshing devices.`);
        fetchUserDevices(userData.id);
      } else if (devicesData && devicesData.length > 0 && devicesData[0].owner_id === userData.id) {
        console.log(`UserDataContext: Devices Effect: Devices data already loaded for owner_id: ${userData.id}`);
      } else {
        console.log(`UserDataContext: Devices Effect: Conditions not met or devices already loaded for ownerId: ${userData.id}.`);
      }
    } else if (!isSignedIn && devicesData !== null) {
      // If signed out and devices data exists, clear it.
      console.log('UserDataContext: Devices Effect: Signed out, clearing devices data.');
      clearDevicesData();
    }
  }, [isSignedIn, userData, devicesData, fetchUserDevices, clearDevicesData]);

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
