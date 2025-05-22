'use client';

import { useEffect, useState, useCallback } from 'react';
import { UserButton, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
// Import API client functions and types from the new module
import {
  getDevices,
  registerDevice,
  deregisterDevice,
  updateDevice, // Added
  DeviceCreatePayload,
  Device,
  DeviceUpdatePayload // Added
} from '../lib/apiClient';

export default function AdminPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();

  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<{ message: string, status: number | null } | null>(null);

  // Form state for registering a new device
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceUniqueKey, setNewDeviceUniqueKey] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('');
  const [newDeviceUserId, setNewDeviceUserId] = useState(-1);

  // State for editing a device
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editDeviceName, setEditDeviceName] = useState('');
  const [editDeviceTypeCode, setEditDeviceTypeCode] = useState('');
  const [editDeviceUniqueKey, setEditDeviceUniqueKey] = useState('');


  const fetchDevices = useCallback(async () => {
    setIsLoadingApi(true);
    setApiError(null);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication token not available. Please sign in again.");
        setIsLoadingApi(false);
        return;
      }
      const data = await getDevices(token);
      setDevices(data);
    } catch (err: any) {
      console.error("Error fetching devices:", err);
      setError("Failed to fetch devices.");
      if (err.status) {
        setApiError({ message: err.message || `Error: ${err.status}`, status: err.status });
      } else {
        setApiError({ message: err.message || "An unknown error occurred", status: null });
      }
    } finally {
      setIsLoadingApi(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchDevices();
    }
  }, [isLoaded, isSignedIn, fetchDevices]);

  if (!isLoaded) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Loading authentication status...
        </div>
    );
  }

  if (!isSignedIn) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Redirecting to sign-in...
        </div>
    );
  }

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setError(null);
    if (!newDeviceName || !newDeviceUniqueKey || !newDeviceType || newDeviceUserId < 0) {
      setError("All fields (User ID, Unique Key, Name, Type) are required for registration.");
      return;
    }
    try {
      const token = await getToken();
      if (!token) {
        setError("Not authenticated. Please sign in again.");
        return;
      }
      const payload: DeviceCreatePayload = {
        unique_key: newDeviceUniqueKey,
        name: newDeviceName,
        type_code: newDeviceType,
      };
      await registerDevice(token, newDeviceUserId, payload);
      setNewDeviceUniqueKey('');
      setNewDeviceName('');
      setNewDeviceType('');
      setNewDeviceUserId(-1);
      fetchDevices();
    } catch (err: any) {
      console.error("Error registering device:", err);
      setError("Failed to register device.");
      if (err.status) {
        setApiError({ message: err.message || `Error: ${err.status}`, status: err.status });
      } else {
        setApiError({ message: err.message || "An unknown error occurred", status: null });
      }
    }
  };

  const handleDeregisterDevice = async (deviceDbId: string) => {
    setApiError(null);
    setError(null);
    if (!confirm("Are you sure you want to deregister this device?")) {
      return;
    }
    try {
      const token = await getToken();
      if (!token) {
        setError("Not authenticated. Please sign in again.");
        return;
      }
      await deregisterDevice(token, deviceDbId);
      fetchDevices();
    } catch (err: any) {
      console.error("Error deregistering device:", err);
      setError("Failed to deregister device.");
      if (err.status) {
        setApiError({ message: err.message || `Error: ${err.status}`, status: err.status });
      } else {
        setApiError({ message: err.message || "An unknown error occurred", status: null });
      }
    }
  };

  const handleStartEdit = (device: Device) => {
    setEditingDevice(device);
    setEditDeviceName(device.name);
    setEditDeviceTypeCode(device.type_code);
    setEditDeviceUniqueKey(device.unique_key);
    setError(null); // Clear general errors when starting an edit
    setApiError(null); // Clear API errors when starting an edit
    // Scroll to the edit form
    const editFormElement = document.getElementById('edit-device-form');
    if (editFormElement) {
      editFormElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingDevice(null);
    setEditDeviceName('');
    setEditDeviceTypeCode('');
    setEditDeviceUniqueKey('');
  };

  const handleUpdateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;

    setApiError(null);
    setError(null);

    if (!editDeviceName.trim() || !editDeviceTypeCode.trim() || !editDeviceUniqueKey.trim()) {
      setError("Device Name, Type Code, and Unique Key cannot be empty for an update.");
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setError("Not authenticated. Please sign in again.");
        return;
      }
      const payload: DeviceUpdatePayload = {
        name: editDeviceName,
        type_code: editDeviceTypeCode,
        unique_key: editDeviceUniqueKey,
      };
      await updateDevice(token, editingDevice.id, payload);
      fetchDevices();
      handleCancelEdit(); // Reset form and editing state
      // Optionally, show a success message: e.g., setError("Device updated successfully!"); but make it visually distinct
    } catch (err: any) {
      console.error("Error updating device:", err);
      setError("Failed to update device.");
      if (err.status) {
        setApiError({ message: err.message || `Error: ${err.status}`, status: err.status });
      } else {
        setApiError({ message: err.message || "An unknown error occurred", status: null });
      }
    }
  };

  return (
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Device Management</h1>
          <UserButton afterSignOutUrl="/sign-in" />
        </header>

        {apiError && (
            <div
                className={`p-4 mb-4 text-sm rounded-lg ${
                    apiError.status === 403 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                }`}
                role="alert"
            >
          <span className="font-medium">
            {apiError.status === 403 ? "Access Denied: " : "API Error: "}
          </span>
              {apiError.message}
              {apiError.status === 403 && <p className="mt-1 text-xs">You do not have permission to perform this action. Please contact an administrator if you believe this is an error.</p>}
            </div>
        )}
        {error && !apiError && (
            <p className="text-red-500 bg-red-100 p-3 rounded mb-4 dark:text-red-300 dark:bg-red-900">{error}</p>
        )}

        {/* Register New Device Form */}
        {!editingDevice && ( // Hide register form when editing
            <div className="mb-8 p-6 bg-white shadow-md rounded-lg dark:bg-gray-800">
              <h2 className="text-2xl font-semibold mb-4 dark:text-white">Register New Device</h2>
              <form onSubmit={handleRegisterDevice} className="space-y-4">
                <div>
                  <label htmlFor="deviceUserId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Device User ID (Internal DB ID):</label>
                  <input
                      type="number"
                      id="deviceUserId"
                      value={newDeviceUserId === -1 ? '' : newDeviceUserId}
                      onChange={(e) => setNewDeviceUserId(e.target.value === '' ? -1 : e.target.valueAsNumber)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                      placeholder="Enter user ID (number)"
                      required
                  />
                </div>
                <div>
                  <label htmlFor="deviceUniqueKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Device
                    Unique Key (Hardware ID):</label>
                  <input
                      type="text"
                      id="deviceUniqueKey"
                      value={newDeviceUniqueKey}
                      onChange={(e) => setNewDeviceUniqueKey(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                      required
                  />
                </div>
                <div>
                  <label htmlFor="deviceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Device
                    Name:</label>
                  <input
                      type="text"
                      id="deviceName"
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                      required
                  />
                </div>
                <div>
                  <label htmlFor="deviceType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Device
                    Type Code:</label>
                  <input
                      type="text"
                      id="deviceType"
                      value={newDeviceType}
                      onChange={(e) => setNewDeviceType(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                      required
                  />
                </div>
                <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Register Device
                </button>
              </form>
            </div>
        )}

        {/* Update Device Form */}
        {editingDevice && (
            <div id="edit-device-form" className="my-8 p-6 bg-yellow-50 shadow-md rounded-lg dark:bg-gray-700 border border-yellow-300 dark:border-yellow-600">
              <h2 className="text-2xl font-semibold mb-4 dark:text-white">
                Update Device: <span className="font-normal">{editingDevice.name} (HW ID: {editingDevice.unique_key}, DB ID: {editingDevice.id})</span>
              </h2>
              <form onSubmit={handleUpdateDevice} className="space-y-4">
                <div>
                  <label htmlFor="editDeviceUniqueKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Device Unique Key (Hardware ID):
                  </label>
                  <input
                      type="text"
                      id="editDeviceUniqueKey"
                      value={editDeviceUniqueKey}
                      onChange={(e) => setEditDeviceUniqueKey(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      required
                  />
                </div>
                <div>
                  <label htmlFor="editDeviceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Device Name:
                  </label>
                  <input
                      type="text"
                      id="editDeviceName"
                      value={editDeviceName}
                      onChange={(e) => setEditDeviceName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      required
                  />
                </div>
                <div>
                  <label htmlFor="editDeviceTypeCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Device Type Code:
                  </label>
                  <input
                      type="text"
                      id="editDeviceTypeCode"
                      value={editDeviceTypeCode}
                      onChange={(e) => setEditDeviceTypeCode(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Save Changes
                  </button>
                  <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-500 dark:text-gray-200 dark:hover:bg-gray-400 dark:border-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
        )}


        {/* Registered Devices Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800">
          <h2 className="text-2xl font-semibold p-6 dark:text-white">Registered Devices</h2>
          {isLoadingApi ? (
              <p className="p-6 dark:text-gray-300">Loading devices...</p>
          ) : devices.length === 0 && !error && !apiError ? (
              <p className="p-6 dark:text-gray-300">No devices found.</p>
          ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">DB ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Unique Key (HW ID)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Owner User ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Actions</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {devices.map((device) => (
                      <tr key={device.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{device.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.unique_key}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.type_code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{device.owner_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                              onClick={() => handleStartEdit(device)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                              disabled={!!editingDevice && editingDevice.id === device.id} // Disable if currently editing this device
                          >
                            Edit
                          </button>
                          <button
                              onClick={() => handleDeregisterDevice(device.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              disabled={!!editingDevice} // Disable deregister if any edit is in progress for safety
                          >
                            Deregister
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
        </div>
      </div>
  );
}
