// app/(home)/device/[id].tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, Link } from 'expo-router'; // Added Link and TouchableOpacity
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

// Chart configuration
const chartConfig = {
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
};

export default function DeviceDetailsScreen() {
    const params = useLocalSearchParams<{ id: string; deviceString: string }>();
    const [device, setDevice] = useState<Device | null>(null);
    const [readings, setReadings] = useState<Reading[]>([]);
    const [isLoading, setIsLoading] = useState(true); // For initial device info parse
    const [isReadingsLoading, setIsReadingsLoading] = useState(true); // Specifically for readings
    const [error, setError] = useState<string | null>(null); // Main error for device parsing
    const [readingsError, setReadingsError] = useState<string | null>(null); // Specific error for readings
    const [refreshing, setRefreshing] = useState(false);
    const api = useApi(); // Assumes useApi is memoized correctly

    // Debugging: Log when params or api reference changes
    const prevParamsRef = useRef(params);
    const prevApiRef = useRef(api);

    // Effect to parse device information from route parameters
    useEffect(() => {
        console.log('DeviceDetailsScreen: Params effect running. deviceString:', params?.deviceString, 'param.id:', params?.id);
        setIsLoading(true);
        setDevice(null);
        setError(null);
        setReadingsError(null);
        setReadings([]);
        setIsReadingsLoading(true);

        if (params?.deviceString && params?.id) {
            try {
                const parsedDevice = JSON.parse(params.deviceString) as Device;
                if (String(parsedDevice.id) !== params.id) {
                    console.warn(`Device ID mismatch: Parsed ID ${parsedDevice.id}, Param ID ${params.id}`);
                    setError("Device information mismatch. Please go back and try again.");
                    setIsLoading(false);
                    setIsReadingsLoading(false);
                    return;
                }
                setDevice(parsedDevice);
                setIsLoading(false); // Device info parsed successfully
            } catch (e) {
                console.error("Failed to parse deviceString:", e);
                setError("Failed to load device details from parameters. Please go back and try again.");
                setDevice(null);
                setIsLoading(false);
                setIsReadingsLoading(false);
            }
        } else {
            setError("Device details not provided or ID missing. Please go back and try again.");
            setDevice(null);
            setIsLoading(false);
            setIsReadingsLoading(false);
        }
    }, [params?.deviceString, params?.id]); // Only rerun if these specific properties change

    // Effect to fetch readings when device is set, or when refreshing
    useEffect(() => {
        if (error) { // If there's a main error (e.g. device parsing failed)
            console.log('DeviceDetailsScreen: Skipping readings fetch due to main error:', error);
            setIsReadingsLoading(false);
            if (refreshing) setRefreshing(false);
            return;
        }

        const loadReadings = async () => {
            if (!device) {
                console.log('DeviceDetailsScreen: loadReadings - device is null, skipping fetch.');
                setIsReadingsLoading(false);
                if (refreshing) setRefreshing(false);
                return;
            }

            if (!refreshing) {
                setIsReadingsLoading(true);
            }
            setReadingsError(null);

            try {
                console.log(`DeviceDetailsScreen: Attempting to fetch readings for device ID: ${device.id}. Refreshing: ${refreshing}`);
                const fetchedReadings = await api.getDeviceReadings(device.id, 90);
                setReadings(fetchedReadings || []);
            } catch (e) {
                console.error("Failed to fetch readings:", e);
                const msg = e instanceof Error ? `Readings Error: ${e.message}` : "Failed to load readings data.";
                setReadingsError(msg);
                setReadings([]);
            } finally {
                setIsReadingsLoading(false);
                if (refreshing) {
                    setRefreshing(false);
                }
            }
        };

        if (device && !isLoading) { // device is ready and parsing is done
            loadReadings();
        } else if (!device && !isLoading && !error) {
            // Device parsing finished, resulted in no device, but no explicit error string was set.
            // Ensure loading states are correctly false.
            setIsReadingsLoading(false);
            if (refreshing) setRefreshing(false);
        }
        // Dependencies:
        // - `device`: When the device object changes (set by the params effect).
        // - `api`: If the api object reference changes (should be stable).
        // - `refreshing`: When a pull-to-refresh action starts this state changes.
        // - `isLoading`: From device parsing; ensures we only fetch after parsing is complete.
        // - `error`: From device parsing; ensures we don't fetch if parsing failed.
    }, [device, refreshing, isLoading, error]);

    const onRefresh = useCallback(() => {
        console.log('DeviceDetailsScreen: onRefresh called.');
        setRefreshing(true); // This will trigger the readings useEffect
    }, []);

    if (isLoading) { // Initial loading for device parsing
        return (
            <Container style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading device data...</Text>
            </Container>
        );
    }

    if (error) { // If device parsing or a fundamental issue occurred
        return (
            <Container style={styles.centered}>
                <Stack.Screen options={{ title: 'Error' }} />
                <Text style={styles.errorText}>{error}</Text>
            </Container>
        );
    }

    if (!device) { // Fallback, should be caught by `error` or `isLoading`
        return (
            <Container style={styles.centered}>
                <Stack.Screen options={{ title: 'Device Not Found' }} />
                <Text style={styles.errorText}>Device details are unavailable. Please go back.</Text>
            </Container>
        );
    }

    const renderDeviceInformation = () => {
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
        if (isReadingsLoading && readings.length === 0 && !refreshing) return null;
        if (readings.length === 0 && !isReadingsLoading) return null;
        if (readings.length === 0) return <Text style={styles.infoText}>No data for averages.</Text>;

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
        if (isReadingsLoading && readings.length === 0 && !refreshing) return null;
        if (readings.length === 0 && !isReadingsLoading) return null;
        if (readings.length === 0) return <Text style={styles.infoText}>No data for chart.</Text>;

        const chartReadings = [...readings].reverse();
        if (chartReadings.length < 2) return <Text style={styles.infoText}>Not enough data points for a chart (need at least 2).</Text>;

        const maxLabels = 6;
        const step = Math.max(1, Math.floor(chartReadings.length / maxLabels));
        let labels = chartReadings
            .map((r, index) => (index % step === 0 ? new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null))
            .filter(Boolean) as string[];

        // Ensure first and last labels are present if there's enough data and space
        if (labels.length === 0 && chartReadings.length > 0) {
            labels.push(new Date(chartReadings[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            if (chartReadings.length > 1) {
                labels.push(new Date(chartReadings[chartReadings.length - 1].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
        } else if (labels.length > 0 && chartReadings.length > 1) { // Check labels.length > 0 to avoid errors on empty labels
            const firstTime = new Date(chartReadings[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const lastTime = new Date(chartReadings[chartReadings.length - 1].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (labels[0] !== firstTime && chartReadings.length > maxLabels) labels.unshift(firstTime);
            if (labels[labels.length - 1] !== lastTime && chartReadings.length > maxLabels) labels.push(lastTime);
        }
        // If after all that, labels are still empty (e.g. only one data point), provide fallbacks.
        if (labels.length === 0 && chartReadings.length === 1) {
            labels = [new Date(chartReadings[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })];
        } else if (labels.length === 0) {
            labels = ['Start', 'End'];
        }


        const chartData = {
            labels: labels,
            datasets: [
                { data: chartReadings.map(r => r.temperature), color: (opacity = 1) => `rgba(235, 64, 52, ${opacity})`, strokeWidth: 2, legend: "Temp (°C)" },
                { data: chartReadings.map(r => r.humidity), color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`, strokeWidth: 2, legend: "Humidity (%)" },
                { data: chartReadings.map(r => r.light_intensity), color: (opacity = 1) => `rgba(241, 196, 15, ${opacity})`, strokeWidth: 2, legend: "Light" },
            ],
            legend: ['Temp (°C)', 'Humidity (%)', 'Light'], // This legend prop for LineChart might be specific
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
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chartStyle}
                        fromZero={false} // Adjust as needed
                        // withShadow // Optional
                        // withVerticalLines // Optional
                        // withHorizontalLines // Optional
                    />
                </ScrollView>
            </View>
        );
    };

    return (
        <Container>
            <Stack.Screen options={{ title: device.name || `Device ${device.id}` }} />
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary}/>}
                showsVerticalScrollIndicator={false}
            >
                {renderDeviceInformation()}

                {isReadingsLoading && !refreshing && readings.length === 0 &&
                    <View style={styles.centeredContent}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.loadingText}>Loading readings...</Text>
                    </View>
                }
                {readingsError && !isReadingsLoading &&
                    <Text style={[styles.errorText, styles.specificErrorText]}>{readingsError}</Text>
                }

                {!isReadingsLoading && !readingsError && readings.length > 0 && (
                    <>
                        {renderAverageReadings()}
                        {renderReadingsChart()}
                    </>
                )}

                {!isReadingsLoading && !readingsError && readings.length === 0 && device &&
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
    centeredContent: {
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
        backgroundColor: colors.background, // Changed from white for theme consistency
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
        // No specific styles needed if InfoRow handles its layout
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Changed for better alignment with potentially long values
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.textLight, // Using a lighter border or remove if too much
    },
    infoLabel: {
        fontSize: fontSizes.body,
        color: colors.text,
        fontWeight: '500',
        marginRight: spacing.sm,
        flex: 1, // Give label a flex proportion
    },
    infoValue: {
        fontSize: fontSizes.body,
        color: colors.textLight,
        textAlign: 'right',
        flex: 2, // Give value more space
    },
    errorText: { // General error text
        color: colors.error,
        textAlign: 'center',
        marginVertical: spacing.md,
        padding: spacing.md,
        backgroundColor: '#ffebee', // Light red background for errors
        borderRadius: borderRadius.sm,
        fontSize: fontSizes.body,
    },
    specificErrorText: { // For non-blocking errors like readingsError
        backgroundColor: 'transparent', // No heavy background
        padding: spacing.sm, // Less padding
        color: colors.error,
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
