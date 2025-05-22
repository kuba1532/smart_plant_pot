 'use client';

  import { useEffect, useState, useCallback } from 'react'; // Added useCallback
  import { UserButton, useAuth } from '@clerk/nextjs';
  import { useRouter } from 'next/navigation'; // Added useRouter
  // Import API client functions and types from the new module
  import { getDevices, registerDevice, deregisterDevice, DeviceCreatePayload, Device } from '../lib/apiClient';

  export default function AdminPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();

  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(true); // Renamed from isLoading for clarity
  const [error, setError] = useState<string | null>(null); // General page error message
  const [apiError, setApiError] = useState<{ message: string, status: number | null } | null>(null);

  // Form state for registering a new device
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceUniqueKey, setNewDeviceUniqueKey] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('');
  const [newDeviceUserId, setNewDeviceUserId] = useState(-1);

  const fetchDevices = useCallback(async () => {
  setIsLoadingApi(true);
  setApiError(null);
  setError(null); // Clear general errors as well
  try {
  const token = await getToken();
  if (!token) {
  // This should ideally not be reached if page is protected, but good as a safeguard
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
}, [getToken]); // getToken is stable, setters are stable

  // Effect for redirection if not signed in
  useEffect(() => {
  if (isLoaded && !isSignedIn) {
  router.push('/sign-in');
}
}, [isLoaded, isSignedIn, router]);

  // Effect to fetch devices when authenticated and ready
  useEffect(() => {
  if (isLoaded && isSignedIn) {
  fetchDevices();
}
}, [isLoaded, isSignedIn, fetchDevices]); // fetchDevices is memoized

  // Handle Clerk loading state: wait until Clerk has determined auth status
  if (!isLoaded) {
  return (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
  Loading authentication status...
</div>
);
}

// If Clerk has loaded but user is not signed in, redirect is in progress.
// Render null or a message to avoid flashing content.
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
  if (!newDeviceName || !newDeviceUniqueKey || !newDeviceType) {
    setError("All fields are required for registration.");
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
    // setError(null); // Already cleared at the start
    fetchDevices(); // Refresh the list
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
    // setError(null); // Already cleared at the start
    fetchDevices(); // Refresh the list
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

// Page content is rendered only if isLoaded is true and isSignedIn is true
return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Device Management</h1>
        <UserButton afterSignOutUrl="/sign-in" />
      </header>

      {apiError && (
          <div
              className={`p-4 mb-4 text-sm rounded-lg ${
                  apiError.status === 403 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
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
      {error && !apiError && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}


      <div className="mb-8 p-6 bg-white shadow-md rounded-lg dark:bg-gray-800">
        <h2 className="text-2xl font-semibold mb-4 dark:text-white">Register New Device</h2>
        <form onSubmit={handleRegisterDevice} className="space-y-4">
          <div>
            <label htmlFor="deviceUserId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Device User id:</label>
            <input
                type="number"
                id="deviceUserId"
                value={newDeviceUserId}
                onChange={(e) => setNewDeviceUserId(e.target.valueAsNumber)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                required
            />
          </div>
          <div>
            <label htmlFor="deviceUniqueKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Device
              Unique Key (Unique Identifier):</label>
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
              Type:</label>
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

      <div className="bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800">
        <h2 className="text-2xl font-semibold p-6 dark:text-white">Registered Devices</h2>
        {isLoadingApi ? (
            <p className="p-6 dark:text-gray-300">Loading devices...</p>
        ) : devices.length === 0 && !error && !apiError ? (
            <p className="p-6 dark:text-gray-300">No devices found.</p>
        ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Device ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Owner User ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Actions</th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {devices.map((device) => (
                  <tr key={device.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.device_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{device.type_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{device.owner_user_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                          onClick={() => handleDeregisterDevice(device.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Deregister
                      </button>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
        )}
      </div>
    </div>
);
}
