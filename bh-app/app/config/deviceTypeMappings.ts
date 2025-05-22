// app/config/deviceTypeMappings.ts

export interface DeviceTypeInfo {
    name: string;
    // You can add more properties here if needed, e.g., icon, description
}

export const deviceTypeMappings: Record<string, DeviceTypeInfo> = {
    "rx": { name: "Rauni X1" },
    // Add other device types here as needed
};

export const getDeviceTypeName = (typeCode: string): string => {
    return deviceTypeMappings[typeCode]?.name || typeCode; // Fallback to typeCode if no mapping found
};
