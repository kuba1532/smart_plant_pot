// app/components/UserData.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Platform } from 'react-native';
import { useUserDataContext } from '../context/UserDataContext'; // Import the context hook
import { colors, spacing } from '../styles/theme';
import { Button } from './Button';

// For debug message, if you need the base URL
const API_BASE_URL_DEBUG = 'https://user-server-bh-168223699989.us-central1.run.app';

export const UserData = () => {
  const { userData, isLoading, error, fetchUserData } = useUserDataContext();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData(); // Call context's fetch function
    setRefreshing(false);
  }, [fetchUserData]);

  // Initial loading state (when context is loading and component doesn't have data yet)
  if (isLoading && !refreshing && !userData) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
    );
  }

  return (
      <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
      >
        {error && !userData ? ( // Show error if context has an error and no data is available
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorHint}>
                Check if your API server is running and accessible.
              </Text>
              <Button title="Try Again" onPress={fetchUserData} variant="primary" />
            </View>
        ) : userData ? ( // If data is available from context
            <View style={styles.dataContainer}>
              <Text style={styles.dataTitle}>Your User Details (from Context)</Text>

              {/* Display fields based on /users/me response structure */}
              {userData.id !== undefined && (
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Internal ID:</Text>
                  <Text style={styles.dataValue}>{userData.id}</Text>
                </View>
              )}
              {!!userData.clerk_id && ( // or userData.clerk_id ? (...) : null
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Clerk User ID:</Text>
                    <Text style={styles.dataValue}>{userData.clerk_id}</Text>
                  </View>
              )}
              {!!userData.created_at && (
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Account Created:</Text>
                  <Text style={styles.dataValue}>{new Date(userData.created_at).toLocaleString()}</Text>
                </View>
              )}

              {/* Fallback for unexpected data structure or if main fields are missing */}
              {Object.keys(userData).length > 0 && !userData.id && !userData.clerk_id && !userData.created_at &&
                Object.entries(userData).map(([key, value]) => (
                  <View key={key} style={styles.dataRow}>
                    <Text style={styles.dataLabel}>{key}:</Text>
                    <Text style={styles.dataValue}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </Text>
                  </View>
              ))}

              {/* If userData is an empty object */}
              {Object.keys(userData).length === 0 && (
                  <Text style={styles.noDataText}>Response received but user data is empty.</Text>
              )}
            </View>
        ) : !isLoading ? ( // If not loading, no data, and no error (e.g., initial state or user signed out)
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No user data available.</Text>
              <Text style={styles.noDataHint}>
                This may be because you are signed out or data is still loading.
              </Text>
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information</Text>
                <Text style={styles.debugText}>
                  - API Endpoint for User Data: {API_BASE_URL_DEBUG}/users/me{'\n'}
                  - Platform: {Platform.OS} {Platform.Version}{'\n'}
                  - Data from context: {userData === null ? 'null' : userData === undefined ? 'undefined' : 'empty object'}
                </Text>
              </View>
            </View>
        ) : null /* This case (isLoading is true but not caught by the first if) should be minimal */}
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textLight,
    fontSize: 16,
  },
  errorContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 16,
  },
  errorHint: {
    color: colors.textLight,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontSize: 14,
  },
  dataContainer: {
    padding: spacing.md,
  },
  dataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Adjusted for better layout
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dataLabel: {
    fontWeight: '500',
    color: colors.text,
    marginRight: spacing.sm, // Added margin
  },
  dataValue: {
    flex: 1, // Allow value to take remaining space
    color: colors.textLight,
    textAlign: 'right', // Align value to the right
  },
  noDataContainer: {
    alignItems: 'center',
    padding: spacing.md,
  },
  noDataText: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  noDataHint: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  debugContainer: {
    marginTop: spacing.md,
    width: '100%',
    padding: spacing.md,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  debugText: {
    fontSize: 12,
    color: colors.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default UserData;
