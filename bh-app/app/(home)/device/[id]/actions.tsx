// app/(home)/device/[id]/actions.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Slider from '@react-native-community/slider'; // Import the Slider
import { Container } from '@/app/components/Container';
import { Input } from '@/app/components/Input';
import { Button } from '@/app/components/Button';
import { useApi, ActionResponse, ChangeSettingsPayload, SendCommandPayload } from '@/app/services/api';
import { colors, spacing, fontSizes, borderRadius } from '@/app/styles/theme';

// Helper to format Date object to HH:MM (for display for DateTimePicker)
const formatTimeForDisplay = (date: Date | null): string => {
    if (!date) return "Not set";
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Helper to format Date object to HH:MM:SS.000Z (for API for DateTimePicker selections)
const formatDateTimeToAPIDuration = (date: Date | null): string => {
    if (!date) return "";
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}.000Z`;
};

// Helper to format seconds (from slider) to HH:MM:SS.000Z (for API)
const formatSecondsToAPIDuration = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00:00.000Z";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.000Z`;
};


export default function DeviceActionsScreen() {
    const params = useLocalSearchParams<{ deviceId: string; deviceUniqueKey: string; deviceName: string }>();
    const { deviceId, deviceUniqueKey, deviceName } = params;
    const api = useApi();

    // State for Change Settings form
    const [maxHumidity, setMaxHumidity] = useState<string>('');
    const [minHumidity, setMinHumidity] = useState<string>('');
    const [maxBrightness, setMaxBrightness] = useState<string>('');
    const [minBrightness, setMinBrightness] = useState<string>('');
    const [brightPeriodStartDate, setBrightPeriodStartDate] = useState<Date | null>(null);
    const [brightPeriodEndDate, setBrightPeriodEndDate] = useState<Date | null>(null);
    const [changeSettingsLoading, setChangeSettingsLoading] = useState(false);
    const [changeSettingsError, setChangeSettingsError] = useState<string | null>(null);
    const [changeSettingsSuccess, setChangeSettingsSuccess] = useState<string | null>(null);

    // State for Send Command form
    const [waterForSeconds, setWaterForSeconds] = useState<number>(0); // For Slider (0 to 120 seconds)
    const [illuminateForDate, setIlluminateForDate] = useState<Date | null>(null); // Still uses DateTimePicker
    const [sendCommandLoading, setSendCommandLoading] = useState(false);
    const [sendCommandError, setSendCommandError] = useState<string | null>(null);
    const [sendCommandSuccess, setSendCommandSuccess] = useState<string | null>(null);

    // State for DateTimePicker (only for bright period and illuminateFor)
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [currentPickerMode, setCurrentPickerMode] = useState<'brightStart' | 'brightEnd' | 'illuminateFor' | null>(null);
    const [pickerInitialDate, setPickerInitialDate] = useState(new Date());

    const showDateTimePicker = (mode: 'brightStart' | 'brightEnd' | 'illuminateFor') => {
        setCurrentPickerMode(mode);
        let dateToSet = new Date();
        if (mode === 'brightStart' && brightPeriodStartDate) dateToSet = brightPeriodStartDate;
        else if (mode === 'brightEnd' && brightPeriodEndDate) dateToSet = brightPeriodEndDate;
        else if (mode === 'illuminateFor' && illuminateForDate) dateToSet = illuminateForDate;
        else if (mode === 'illuminateFor') {
            dateToSet.setHours(0,0,0,0); // For illuminate duration, start picker at 00:00
        }
        setPickerInitialDate(dateToSet);
        setIsPickerVisible(true);
    };

    const hideDateTimePicker = () => {
        setIsPickerVisible(false);
        setCurrentPickerMode(null);
    };

    const handleConfirmDateTime = (date: Date) => {
        switch (currentPickerMode) {
            case 'brightStart':
                setBrightPeriodStartDate(date);
                break;
            case 'brightEnd':
                setBrightPeriodEndDate(date);
                break;
            case 'illuminateFor':
                setIlluminateForDate(date);
                break;
        }
        hideDateTimePicker();
    };

    const handleChangeSettings = async () => {
        if (!deviceUniqueKey || !deviceId) {
            setChangeSettingsError("Device information is missing.");
            return;
        }
        const numDeviceId = parseInt(deviceId, 10);
        if (isNaN(numDeviceId)) {
            setChangeSettingsError("Invalid Device ID.");
            return;
        }
        const parsedMaxHumidity = parseFloat(maxHumidity);
        const parsedMinHumidity = parseFloat(minHumidity);
        const parsedMaxBrightness = parseFloat(maxBrightness);
        const parsedMinBrightness = parseFloat(minBrightness);

        if (isNaN(parsedMaxHumidity) || isNaN(parsedMinHumidity) || isNaN(parsedMaxBrightness) || isNaN(parsedMinBrightness)) {
            setChangeSettingsError("Humidity and Brightness values must be numbers.");
            return;
        }
        if (!brightPeriodStartDate || !brightPeriodEndDate) {
            setChangeSettingsError("Bright period start and end times must be set.");
            return;
        }

        const payload: ChangeSettingsPayload = {
            maxHumidity: parsedMaxHumidity,
            minHumidity: parsedMinHumidity,
            maxBrightness: parsedMaxBrightness,
            minBrightness: parsedMinBrightness,
            brightPeriodStart: formatDateTimeToAPIDuration(brightPeriodStartDate),
            brightPeriodEnd: formatDateTimeToAPIDuration(brightPeriodEndDate),
            deviceId: numDeviceId,
        };

        setChangeSettingsLoading(true);
        setChangeSettingsError(null);
        setChangeSettingsSuccess(null);
        try {
            const response: ActionResponse = await api.changeDeviceSettings(payload);
            setChangeSettingsSuccess(`Status: ${response.status}. ${response.message || 'Settings change request sent.'}`);
            Alert.alert("Success", `Settings change request sent: ${response.status}`);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to change settings.";
            setChangeSettingsError(errorMsg);
            Alert.alert("Error", errorMsg);
        } finally {
            setChangeSettingsLoading(false);
        }
    };

    const handleSendCommand = async () => {
        if (!deviceUniqueKey || !deviceId) {
            setSendCommandError("Device information is missing.");
            return;
        }
        const numDeviceId = parseInt(deviceId, 10);
        if (isNaN(numDeviceId)) {
            setSendCommandError("Invalid Device ID.");
            return;
        }
        // waterForSeconds is already a number, no need to check if it's "set" like a Date object
        // It defaults to 0, which could be a valid command.
        if (!illuminateForDate) {
            setSendCommandError("Illuminate For duration must be set.");
            return;
        }

        const payload: SendCommandPayload = {
            waterFor: formatSecondsToAPIDuration(waterForSeconds),
            illuminateFor: formatDateTimeToAPIDuration(illuminateForDate),
            deviceId: numDeviceId,
        };

        setSendCommandLoading(true);
        setSendCommandError(null);
        setSendCommandSuccess(null);
        try {
            const response: ActionResponse = await api.sendDeviceCommand(payload);
            setSendCommandSuccess(`Status: ${response.status}. ${response.message || 'Command sent.'}`);
            Alert.alert("Success", `Command sent: ${response.status}`);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to send command.";
            setSendCommandError(errorMsg);
            Alert.alert("Error", errorMsg);
        } finally {
            setSendCommandLoading(false);
        }
    };

    if (!deviceId || !deviceUniqueKey) {
        return (
            <Container style={styles.centered}>
                <Text style={styles.errorText}>Device information missing. Please go back.</Text>
            </Container>
        );
    }

    return (
        <Container>
            <Stack.Screen options={{ title: deviceName ? `${deviceName} - Actions` : 'Device Actions' }} />
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.deviceInfoContainer}>
                    <Text style={styles.deviceInfoText}>Device Name: {deviceName || 'N/A'}</Text>
                    <Text style={styles.deviceInfoText}>Unique Key: {deviceUniqueKey}</Text>
                    <Text style={styles.deviceInfoText}>Internal ID: {deviceId}</Text>
                </View>

                {/* Change Settings Form */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Change Device Settings</Text>
                    <Input label="Max Humidity (%)" value={maxHumidity} onChangeText={setMaxHumidity} placeholder="e.g., 70" keyboardType="numeric" />
                    <Input label="Min Humidity (%)" value={minHumidity} onChangeText={setMinHumidity} placeholder="e.g., 40" keyboardType="numeric" />
                    <Input label="Max Brightness (lux)" value={maxBrightness} onChangeText={setMaxBrightness} placeholder="e.g., 1000" keyboardType="numeric" />
                    <Input label="Min Brightness (lux)" value={minBrightness} onChangeText={setMinBrightness} placeholder="e.g., 100" keyboardType="numeric" />
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bright Period Start</Text>
                        <TouchableOpacity onPress={() => showDateTimePicker('brightStart')} style={styles.timeInputDisplay}>
                            <Text style={styles.timeInputText}>{formatTimeForDisplay(brightPeriodStartDate)}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bright Period End</Text>
                        <TouchableOpacity onPress={() => showDateTimePicker('brightEnd')} style={styles.timeInputDisplay}>
                            <Text style={styles.timeInputText}>{formatTimeForDisplay(brightPeriodEndDate)}</Text>
                        </TouchableOpacity>
                    </View>
                    {changeSettingsError && <Text style={styles.errorText}>{changeSettingsError}</Text>}
                    {changeSettingsSuccess && <Text style={styles.successText}>{changeSettingsSuccess}</Text>}
                    <Button title="Update Settings" onPress={handleChangeSettings} disabled={changeSettingsLoading} fullWidth />
                    {changeSettingsLoading && <ActivityIndicator style={styles.loader} size="small" color={colors.primary} />}
                </View>

                {/* Send Command Form */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Send Command to Device</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Water For: {waterForSeconds} seconds</Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={120} // 2 minutes
                            step={1} // Increment by 1 second
                            value={waterForSeconds}
                            onValueChange={setWaterForSeconds}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor={colors.border}
                            thumbTintColor={colors.primaryDark}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Illuminate For (Duration)</Text>
                        <TouchableOpacity onPress={() => showDateTimePicker('illuminateFor')} style={styles.timeInputDisplay}>
                            <Text style={styles.timeInputText}>{formatTimeForDisplay(illuminateForDate)} (HH:MM from 00:00)</Text>
                        </TouchableOpacity>
                    </View>

                    {sendCommandError && <Text style={styles.errorText}>{sendCommandError}</Text>}
                    {sendCommandSuccess && <Text style={styles.successText}>{sendCommandSuccess}</Text>}
                    <Button title="Send Command" onPress={handleSendCommand} disabled={sendCommandLoading} fullWidth />
                    {sendCommandLoading && <ActivityIndicator style={styles.loader} size="small" color={colors.primary} />}
                </View>
            </ScrollView>

            <DateTimePickerModal
                isVisible={isPickerVisible}
                mode="time"
                date={pickerInitialDate}
                onConfirm={handleConfirmDateTime}
                onCancel={hideDateTimePicker}
                is24Hour={true}
            />
        </Container>
    );
}

const styles = StyleSheet.create({
    // ... (keep existing styles)
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    deviceInfoContainer: {
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.secondary,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    deviceInfoText: {
        fontSize: fontSizes.body,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    formSection: {
        marginBottom: spacing.xl,
        padding: spacing.md,
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: fontSizes.title,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.md,
    },
    errorText: {
        color: colors.error,
        marginBottom: spacing.sm,
        fontSize: fontSizes.small,
        textAlign: 'center',
    },
    successText: {
        color: colors.success,
        marginBottom: spacing.sm,
        fontSize: fontSizes.small,
        textAlign: 'center',
    },
    loader: {
        marginTop: spacing.md,
    },
    inputGroup: {
        marginBottom: spacing.md,
        width: '100%',
    },
    label: {
        fontSize: 14,
        color: colors.text,
        marginBottom: spacing.xs,
        fontWeight: '500',
    },
    timeInputDisplay: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.background,
        justifyContent: 'center',
    },
    timeInputText: {
        fontSize: 16,
        color: colors.text,
    },
    slider: { // Style for the slider
        width: '100%',
        height: 40, // Default height, adjust as needed
    }
});
