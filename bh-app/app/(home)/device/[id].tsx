// app/(home)/device/[id].tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { useApi } from '@/app/services/api';
import { Device } from '@/app/context/UserDataContext';
import { colors, spacing, borderRadius, fontSizes } from '@/app/styles/theme';
import { getDeviceTypeName } from '@/app/config/deviceTypeMappings';
import { Container } from '@/app/components/Container';

interface Reading {
    device_id: number;
    time: string;
    humidity: number;
    light_intensity: number;
    temperature: number;
    time_difference_seconds?: number;
}

const screenWidth = Dimensions.get('window').width;

export default function DeviceDetailsScreen() {
    const params = useLocalSearchParams<{ id: string; deviceString: string }>();
    const [device, setDevice] = useState<Device | null>(null);
    const [readings, setReadings] = useState<Reading[]>([]);
    const [isLoading, setIsLoading] = useState(true); // For initial data load (device info + readings)
    const [isReadingsLoading, setIsReadingsLoading] = useState(true); // Specifically for readings
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const api = useApi();

    useEffect(() => {
        setIsLoading(true); // Start loading when params change
        if (params.deviceString) {
            try {
                const parsedDevice = JSON.parse(params.deviceString) as Device;
                setDevice(parsedDevice);
                // Device details are set, now fetch readings if ID matches
                if (String(parsedDevice.id) !== params.id) {
                    console.warn(`Device ID mismatch: Parsed ID ${parsedDevice.id}, Param ID ${params.id}`);
                    setError("Device information mismatch. Please go back and try again.");
                    setIsLoading(false);
                    setIsReadingsLoading(false);
                    return;
                }
            } catch (e) {
                console.error("Failed to parse deviceString:", e);
                setError("Failed to load device details from parameters. Please go back and try again.");
                setDevice(null);
                setIsLoading(false);
                setIsReadingsLoading(false);
            }
        } else {
            setError("Device details not provided. Please go back and try again.");
            setDevice(null);
            setIsLoading(false);
            setIsReadingsLoading(false);
        }
    }, [params.deviceString, params.id]);

    const fetchReadingsData = useCallback(async (isRefreshing = false) => {
        if (!device || String(device.id) !== params.id) {
            // Don't fetch if device isn't set or ID mismatch
            if(device) setError("Device ID mismatch, cannot fetch readings.");
            setIsReadingsLoading(false);
            if(isRefreshing) setRefreshing(false);
            return;
        }

        if (!isRefreshing) setIsReadingsLoading(true);
        setError(null); // Clear previous errors specific to readings

        try {
            const fetchedReadings = await api.getDeviceReadings(device.id, 90);
            setReadings(fetchedReadings || []);
        } catch (e) {
            console.error("Failed to fetch readings:", e);
            setError(e instanceof Error ? `Readings Error: ${e.message}` : "Failed to load readings data.");
            setReadings([]);
        } finally {
            setIsReadingsLoading(false);
            if(isRefreshing) setRefreshing(false);
            setIsLoading(false); // Overall loading stops after first attempt to fetch readings
        }
    }, [device, params.id, api]);

    useEffect(() => {
        if (device && String(device.id) === params.id) { // Ensure device is set and ID matches before fetching
            fetchReadingsData();
        } else if (!params.deviceString && params.id) {
            // This case means deviceString wasn't passed, already handled by first useEffect
            // No device to fetch readings for
            setIsLoading(false);
            setIsReadingsLoading(false);
        }
    }, [device, params.id, fetchReadingsData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchReadingsData(true); // Pass true to indicate it's a refresh
    }, [fetchReadingsData]);


    const renderDeviceInformation = () => {
        if (!device) {
            // This part is shown if deviceString parsing failed or was missing
            return (
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Device Information</Text>
                    <Text style={styles.infoText}>Device details are unavailable.</Text>
                </View>
            );
        }
        const deviceTypeName = getDeviceTypeName(device.type_code);
        return (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Device Information</Text>
                <View style={styles.infoCard}>
                    <InfoRow label="Name" value={device.name || 'N/A'} />
                    <InfoRow label="Type" value={deviceTypeName} />
                    <InfoRow label="Unique Key" value={device.unique_key} />
                    <InfoRow label="Internal ID" value={String(device.id)} />
                    <InfoRow label="Owner ID" value={String(device.owner_id)} />
                    <InfoRow label="Registered" value={new Date(device.created_at).toLocaleString()} />
                </View>
            </View>
        );
    };

    const renderAverageReadings = () => {
        if (isReadingsLoading && readings.length === 0) return null; // Wait for data
        if (readings.length === 0) return null; // No data to average

        const last5Readings = readings.slice(0, 5);
        if (last5Readings.length === 0) return <Text style={styles.infoText}>Not enough data for averages.</Text>;

        const avgTemp = last5Readings.reduce((sum, r) => sum + r.temperature, 0) / last5Readings.length;
        const avgHumidity = last5Readings.reduce((sum, r) => sum + r.humidity, 0) / last5Readings.length;
        const avgLight = last5Readings.reduce((sum, r) => sum + r.light_intensity, 0) / last5Readings.length;

        return (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Average (Last {Math.min(5, readings.length)} Readings)</Text>
                <View style={styles.infoCard}>
                    <InfoRow label="Avg. Temperature" value={`${avgTemp.toFixed(1)} °C`} />
                    <InfoRow label="Avg. Humidity" value={`${avgHumidity.toFixed(1)} %`} />
                    <InfoRow label="Avg. Light Intensity" value={`${avgLight.toFixed(1)}`} />
                </View>
            </View>
        );
    };

    const renderReadingsChart = () => {
        if (isReadingsLoading && readings.length === 0) return null; // Wait for data
        if (readings.length === 0) return null; // No data for chart

        const chartReadings = [...readings].reverse();
        if (chartReadings.length < 2) return <Text style={styles.infoText}>Not enough data points for a chart (need at least 2).</Text>;

        const maxLabels = 6;
        const step = Math.max(1, Math.floor(chartReadings.length / maxLabels));
        const labels = chartReadings
            .map((r, index) => (index % step === 0 ? new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null))
            .filter(Boolean) as string[];

        if (labels.length === 0 && chartReadings.length > 0) {
            labels.push(new Date(chartReadings[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            if (chartReadings.length > 1) {
                labels.push(new Date(chartReadings[chartReadings.length - 1].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
        } else if (labels.length > 1 && chartReadings.length > 1) {
            const firstTime = new Date(chartReadings[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const lastTime = new Date(chartReadings[chartReadings.length - 1].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (labels[0] !== firstTime && chartReadings.length > maxLabels) labels.unshift(firstTime); // Add if not too cluttered
            if (labels[labels.length - 1] !== lastTime && chartReadings.length > maxLabels) labels.push(lastTime);
        }

        const chartData = {
            labels: labels.length > 0 ? labels : ['Start', 'End'],
            datasets: [
                {
                    data: chartReadings.map(r => r.temperature),
                    color: (opacity = 1) => `rgba(235, 64, 52, ${opacity})`,
                    strokeWidth: 2,
                },
                {
                    data: chartReadings.map(r => r.humidity),
                    color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                    strokeWidth: 2,
                },
                {
                    data: chartReadings.map(r => r.light_intensity),
                    color: (opacity = 1) => `rgba(241, 196, 15, ${opacity})`,
                    strokeWidth: 2,
                },
            ],
            legend: ['Temp (°C)', 'Humidity (%)', 'Light'],
        };

        const chartWidth = Math.max(screenWidth - (spacing.lg * 2) - (spacing.md * 2) , chartReadings.length * 35);

        return (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Readings History (Last {chartReadings.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <LineChart
                        data={chartData}
                        width={chartWidth}
                        height={280}
                        yAxisLabel=""
                        yAxisSuffix=""
                        yAxisInterval={1}
                        chartConfig={{
                            backgroundColor: colors.background,
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#f7f7f7',
                            decimalPlaces: 1,
                            color: (opacity = 1) => `rgba(50, 50, 50, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            style: {
                                borderRadius: borderRadius.md,
                            },
                            propsForDots: {
                                r: '3',
                                strokeWidth: '1',
                                stroke: colors.primaryDark,
                            },
                            propsForBackgroundLines: {
                                strokeDasharray: '',
                                stroke: colors.border,
                            },
                        }}
                        bezier
                        style={styles.chartStyle}
                    />
                </ScrollView>
            </View>
        );
    };

    // Main loading state for the whole screen (device details + initial readings)
    if (isLoading) {
        return (
            <Container style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading device data...</Text>
            </Container>
        );
    }

    // If device parsing failed or device details are missing, show error and stop.
    if (!device) {
        return (
            <Container style={styles.centered}>
                <Stack.Screen options={{ title: 'Error' }} />
                <Text style={styles.errorText}>{error || "Device details could not be loaded."}</Text>
            </Container>
        );
    }

    return (
        <Container>
            <Stack.Screen options={{ title: device.name || `Device ${device.id}` }} />
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary}/>}
                showsVerticalScrollIndicator={false}
            >
                {renderDeviceInformation()}

                {error && !isReadingsLoading && <Text style={styles.errorText}>{error}</Text>}

                {isReadingsLoading && readings.length === 0 && !refreshing &&
                    <View style={styles.centeredContent}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.loadingText}>Loading readings...</Text>
                    </View>
                }

                {!isReadingsLoading && readings.length > 0 && renderAverageReadings()}
                {!isReadingsLoading && readings.length > 0 && renderReadingsChart()}

                {!isReadingsLoading && readings.length === 0 && !error && device &&
                    <View style={styles.centeredContent}>
                        <Text style={styles.infoText}>No readings data found for this device.</Text>
                    </View>
                }
            </ScrollView>
        </Container>
    );
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={styles.infoValue} numberOfLines={2} ellipsizeMode="tail">{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    centeredContent: { // For content within the scrollview that needs centering
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.textLight,
        fontSize: fontSizes.body,
    },
    scrollContainer: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    sectionContainer: {
        marginBottom: spacing.lg,
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: fontSizes.title,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    infoCard: {
        // No specific styles needed
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    infoLabel: {
        fontSize: fontSizes.body,
        color: colors.text,
        fontWeight: '500',
        marginRight: spacing.sm,
        flex: 1,
    },
    infoValue: {
        fontSize: fontSizes.body,
        color: colors.textLight,
        textAlign: 'right',
        flex: 2,
    },
    errorText: {
        color: colors.error,
        textAlign: 'center',
        marginVertical: spacing.md,
        padding: spacing.md,
        backgroundColor: '#ffebee',
        borderRadius: borderRadius.sm,
        fontSize: fontSizes.body,
    },
    infoText: {
        color: colors.textLight,
        textAlign: 'center',
        marginVertical: spacing.md,
        fontSize: fontSizes.body,
    },
    chartStyle: {
        marginVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
});
