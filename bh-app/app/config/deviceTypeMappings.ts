// app/config/deviceTypeMappings.ts

export interface DeviceTypeInfo {
    name: string;
    // You can add more properties here if needed, e.g., icon, description
}

export const deviceTypeMappings: Record<string, DeviceTypeInfo> = {
    "rx": { name: "Rauni X1" }
};

export const getDeviceTypeName = (typeCode: string): string => {
    return deviceTypeMappings[typeCode]?.name || typeCode; // Fallback to typeCode if no mapping found
};
