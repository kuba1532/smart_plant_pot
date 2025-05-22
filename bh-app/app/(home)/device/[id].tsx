// app/(home)/device/[id].tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, Stack, Link } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { useApi } from '@/app/services/api';
import { Device } from '@/app/context/UserDataContext';
import { colors, spacing, borderRadius, fontSizes } from '@/app/styles/theme';
import { getDeviceTypeName } from '@/app/config/deviceTypeMappings';
import { Button as CustomButton } from '@/app/components/Button'; // Renamed to avoid conflict if any
import { Container } from '@/app/components/Container'; // Import Container for specific error/loading states


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
    backgroundGradientFrom: colors.secondary, // Use a light beige from theme
    backgroundGradientTo: colors.background, // Use main background beige
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(56, 102, 65, ${opacity})`, // Primary Dark Green
    labelColor: (opacity = 1) => `${colors.textLight}`, // Lighter Brown/Warm Gray
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
    const [isLoading, setIsLoading] = useState(true);
    const [isReadingsLoading, setIsReadingsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [readingsError, setReadingsError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const api = useApi();

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
                setIsLoading(false);
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
    }, [params?.deviceString, params?.id]);

    useEffect(() => {
        if (error) {
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

        if (device && !isLoading) {
            loadReadings();
        } else if (!device && !isLoading && !error) {
            setIsReadingsLoading(false);
            if (refreshing) setRefreshing(false);
        }
    }, [device, refreshing, isLoading, error]); // api is stable and should not be used as a dependency

    const onRefresh = useCallback(() => {
        console.log('DeviceDetailsScreen: onRefresh called.');
        setRefreshing(true);
    }, []);

    if (isLoading) {
        return (
            <Container style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading device data...</Text>
            </Container>
        );
    }

    if (error) {
        return (
            <Container style={styles.centered}>
                <Stack.Screen options={{ title: 'Error' }} />
                <Text style={styles.errorText}>{error}</Text>
            </Container>
        );
    }

    if (!device) {
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

        if (labels.length === 0 && chartReadings.length > 0) {
            labels.push(new Date(chartReadings[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            if (chartReadings.length > 1) {
                labels.push(new Date(chartReadings[chartReadings.length - 1].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
        } else if (labels.length > 0 && chartReadings.length > 1) {
            const firstTime = new Date(chartReadings[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const lastTime = new Date(chartReadings[chartReadings.length - 1].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (labels[0] !== firstTime && chartReadings.length > maxLabels) labels.unshift(firstTime);
            if (labels[labels.length - 1] !== lastTime && chartReadings.length > maxLabels) labels.push(lastTime);
        }
        if (labels.length === 0 && chartReadings.length === 1) {
            labels = [new Date(chartReadings[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })];
        } else if (labels.length === 0) {
            labels = ['Start', 'End'];
        }

        const chartData = {
            labels: labels,
            datasets: [
                { data: chartReadings.map(r => r.temperature), color: (opacity = 1) => `rgba(204, 102, 51, ${opacity})`, strokeWidth: 2, legend: "Temp (°C)" }, // Warm Orange/Brown
                { data: chartReadings.map(r => r.humidity), color: (opacity = 1) => `rgba(60, 124, 138, ${opacity})`, strokeWidth: 2, legend: "Humidity (%)" }, // Muted Teal/Blue
                { data: chartReadings.map(r => r.light_intensity), color: (opacity = 1) => `rgba(220, 175, 60, ${opacity})`, strokeWidth: 2, legend: "Light" },  // Warm Gold/Yellow
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
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chartStyle}
                        fromZero={false}
                    />
                </ScrollView>
            </View>
        );
    };

    return (
        <View style={styles.pageContainer}>
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
                {readingsError && !isReadingsLoading && !refreshing &&
                    <Text style={[styles.errorText, styles.specificErrorText]}>{readingsError}</Text>
                }

                {!isReadingsLoading && !readingsError && readings.length > 0 && !refreshing && (
                    <>
                        {renderAverageReadings()}
                        {renderReadingsChart()}
                    </>
                )}

                {!isReadingsLoading && !readingsError && readings.length === 0 && device && !refreshing &&
                    <View style={styles.centeredContent}>
                        <Text style={styles.infoText}>No readings data found for this device.</Text>
                    </View>
                }
            </ScrollView>
            {device && (
                <View style={styles.floatingButtonContainer}>
                    <Link
                        href={{
                            pathname: `/device/${device.id}/actions`,
                            params: {
                                deviceId: String(device.id),
                                deviceUniqueKey: device.unique_key,
                                deviceName: device.name || `Device ${device.id}`
                            }
                        }}
                        asChild
                    >
                        <CustomButton title="Device Actions" onPress={() => { /* Navigation handled by Link */ }} fullWidth />
                    </Link>
                </View>
            )}
        </View>
    );
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={styles.infoValue} numberOfLines={2} ellipsizeMode="tail">{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: { // For Container usage on error/loading screens
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    centeredContent: { // For content within the scroll view
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
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl + 70, // Adjusted for floating button
    },
    sectionContainer: {
        marginBottom: spacing.lg,
        backgroundColor: colors.secondary, // Use secondary beige for sections
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
// Styles for the card holding rows
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border, // Use theme border color
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
        backgroundColor: '#FADBD8', // Light warm pink/beige for error background
        borderRadius: borderRadius.sm,
        fontSize: fontSizes.body,
    },
    specificErrorText: {
        backgroundColor: 'transparent',
        padding: spacing.sm,
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
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md, // Consistent small top padding for button bar
        paddingBottom: Platform.OS === 'ios' ? spacing.sl : spacing.xxl, // For home indicator
        backgroundColor: colors.background, // Or a slightly different shade for emphasis
        borderTopWidth: 1,
        borderTopColor: colors.border,
// Optional shadow for more "floating" effect
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.00,
        elevation: 5,
    },
});
