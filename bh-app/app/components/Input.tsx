// app/components/Input.tsx
import { Text, TextInput, View, StyleSheet, TextInputProps, Platform } from 'react-native';
import { colors, spacing, borderRadius } from '../styles/theme';

// Combine custom props with standard TextInputProps
interface InputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'secureTextEntry' | 'autoCapitalize' | 'style'> {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
    label?: string;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    style?: TextInputProps['style']; // To style the TextInput itself
}

export const Input = ({
                          value,
                          onChangeText,
                          placeholder,
                          secureTextEntry = false,
                          label,
                          autoCapitalize = 'none',
                          style: textInputStyle, // Renamed to avoid conflict with View's style prop if this component had one
                          ...rest // Pass other TextInputProps like multiline, numberOfLines, textAlignVertical etc.
                      }: InputProps) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                secureTextEntry={secureTextEntry}
                autoCapitalize={autoCapitalize}
                style={[styles.input, textInputStyle]} // Apply textInputStyle here
                placeholderTextColor={colors.textLight}
                {...rest} // Spread remaining props
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
        width: '100%',
    },
    label: {
        fontSize: 14,
        color: colors.text,
        marginBottom: spacing.xs,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm -1, // Adjust padding for Android if needed
        fontSize: 16,
        backgroundColor: colors.background, // Use main background for input field
        color: colors.text,
    },
});
