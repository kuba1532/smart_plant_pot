import { Text, TextInput, View, StyleSheet } from 'react-native'
import { colors, spacing, borderRadius } from '../styles/theme'

interface InputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder: string
  secureTextEntry?: boolean
  label?: string
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}

export const Input = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  label,
  autoCapitalize = 'none',
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
        style={styles.input}
        placeholderTextColor={colors.textLight}
      />
    </View>
  )
}

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
    paddingVertical: spacing.md,
    fontSize: 16,
    backgroundColor: colors.background,
    color: colors.text,
  },
})

export default Input;