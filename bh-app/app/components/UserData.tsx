// Fixed UserData component
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Platform } from 'react-native';
import { useApi } from '../services/api';
import { colors, spacing } from '../styles/theme';
import { Button } from './Button';

export const UserData = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const api = useApi();

  // Add a request in progress ref to prevent duplicate requests
  const requestInProgress = useRef(false);

  const fetchData = useCallback(async () => {
    // Skip if a request is already in progress
    if (requestInProgress.current) {
      console.log('Request already in progress, skipping...');
      return;
    }

    try {
      requestInProgress.current = true;
      setLoading(true);
      setError('');
      console.log('Starting to fetch user data...');
      const userData = await api.getUserData();
      console.log('User data fetched successfully:', userData);
      setData(userData);
    } catch (err) {
      console.error('Error fetching user data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load data: ${errorMessage}`);
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  }, [api]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Use an effect with empty dependency array to only run once
  useEffect(() => {
    console.log('UserData component mounted');
    fetchData();

    // Clean up function
    return () => {
      console.log('UserData component unmounted');
    };
  }, []); // Include fetchData in dependency array

  if (loading && !refreshing) {
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
        {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorHint}>
                Check if your API server is running and accessible
              </Text>
              <Button title="Try Again" onPress={fetchData} variant="primary" />
            </View>
        ) : (
            <View style={styles.dataContainer}>
              <Text style={styles.dataTitle}>Your Protected Data</Text>

              {data ? (
                  <View style={styles.dataContent}>
                    {/* Display the message or any properties in the data */}
                    {data.message ? (
                        <View style={styles.dataRow}>
                          <Text style={styles.dataLabel}>Message:</Text>
                          <Text style={styles.dataValue}>{data.message}</Text>
                        </View>
                    ) : Object.entries(data).length > 0 ? (
                        Object.entries(data).map(([key, value]) => (
                            <View key={key} style={styles.dataRow}>
                              <Text style={styles.dataLabel}>{key}:</Text>
                              <Text style={styles.dataValue}>
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>Response received but no properties found</Text>
                    )}
                  </View>
              ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No data available</Text>
                    <Text style={styles.noDataHint}>
                      Response was successful but no data was returned.
                      Check your API endpoint and authentication.
                    </Text>

                    <View style={styles.debugContainer}>
                      <Text style={styles.debugTitle}>Debug Information</Text>
                      <Text style={styles.debugText}>
                        - API URL: https://user-server-bh-168223699989.us-central1.run.app/protected{'\n'}
                        - Platform: {Platform.OS} {Platform.Version}{'\n'}
                        - Data received: {data === null ? 'null' : data === undefined ? 'undefined' : 'empty object'}
                      </Text>
                    </View>
                  </View>
              )}
            </View>
        )}
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
  dataContent: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dataLabel: {
    flex: 1,
    fontWeight: '500',
    color: colors.text,
  },
  dataValue: {
    flex: 2,
    color: colors.textLight,
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

export default UserData; // Add default export
