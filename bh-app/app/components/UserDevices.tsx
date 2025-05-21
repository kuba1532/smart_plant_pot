// app/components/UserDevices.tsx
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useUserDataContext, Device } from '../context/UserDataContext';
import { colors, spacing, borderRadius } from '../styles/theme';
import { Button } from './Button';
import { getDeviceTypeName } from '../config/deviceTypeMappings'; // Import the helper


const DeviceCard: React.FC<{ device: Device }> = ({ device }) => {
    const deviceTypeName = getDeviceTypeName(device.type_code); // Get the human-readable name

    return (
        <View style={styles.deviceCard}>
            <Link
                href={{
                    pathname: `/device/${device.id}`, // Navigates to app/(home)/device/[id].tsx
                    params: { deviceString: JSON.stringify(device) } // Pass the whole device object as a string
                }}
                asChild
            >
                <TouchableOpacity style={styles.deviceCardContent}>
                    <Text style={styles.deviceName}>{device.name || 'Unnamed Device'}</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Type:</Text>
                        <Text style={styles.detailValue}>{deviceTypeName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Registered:</Text>
                        <Text style={styles.detailValue}>{new Date(device.created_at).toLocaleDateString()}</Text>
                    </View>
                </TouchableOpacity>
            </Link>
        </View>
    );
};

export const UserDevices: React.FC = () => {
    const {
        devicesData,
        isDevicesLoading,
        devicesError,
        fetchUserDevices,
        userData, // To get ownerId for refresh
        isLoading: isUserLoading, // To know if userData is still loading
    } = useUserDataContext();
    const [refreshing, setRefreshing] = React.useState(false);

    const handleRefresh = useCallback(async () => {
        if (userData && userData.id) {
            setRefreshing(true);
            await fetchUserDevices(userData.id);
            setRefreshing(false);
        } else {
            console.log("UserDevices: Cannot refresh, user data or owner ID not available.");
        }
    }, [userData, fetchUserDevices]);

    if (isUserLoading && !userData) { // If user data is still loading, wait for it
        return (
            <View style={styles.statusContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.statusText}>Loading user information...</Text>
            </View>
        );
    }

    if (isDevicesLoading && !refreshing && (!devicesData || devicesData.length === 0)) { // Initial devices loading
        return (
            <View style={styles.statusContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.statusText}>Loading your devices...</Text>
            </View>
        );
    }

    if (devicesError) {
        return (
            <View style={styles.statusContainer}>
                <Text style={styles.errorText}>Error loading devices: {devicesError}</Text>
                {userData && userData.id && (
                    <Button title="Try Again" onPress={() => fetchUserDevices(userData.id)} variant="primary" />
                )}
            </View>
        );
    }

    if (!devicesData || devicesData.length === 0) {
        return (
            <ScrollView
                contentContainerStyle={styles.statusContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                <Text style={styles.statusText}>No devices found for your account.</Text>
                <Text style={styles.hintText}>Pull down to refresh or add a new device through the portal.</Text>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
            <Text style={styles.title}>Your Devices</Text>
            {devicesData.map((device) => (
                <DeviceCard key={device.id} device={device} />
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: spacing.lg,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    statusContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
        minHeight: 200, // Ensure it takes some space when empty
    },
    statusText: {
        marginTop: spacing.md,
        color: colors.textLight,
        fontSize: 16,
        textAlign: 'center',
    },
    hintText: {
        marginTop: spacing.sm,
        color: colors.textLight,
        fontSize: 14,
        textAlign: 'center',
    },
    errorText: {
        color: colors.error,
        marginBottom: spacing.md,
        textAlign: 'center',
        fontWeight: '500',
        fontSize: 16,
    },
    deviceCard: {
        backgroundColor: colors.background, // Keep background on the outer View for consistent shadow
        borderRadius: borderRadius.lg, // Keep border radius on outer View
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3, // Slightly increased for better visibility
        elevation: 1,
    },
    deviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: spacing.sm,
    },
    deviceCardContent: { // Style for the pressable content area
        padding: spacing.md, // Moved padding here from deviceCard
        borderRadius: borderRadius.lg, // Ensure content also respects border radius if needed
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs / 2,
    },
    detailLabel: {
        fontSize: 14,
        color: colors.text,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: colors.textLight,
        maxWidth: '60%',
        textAlign: 'right',
    },
});

export default UserDevices;
