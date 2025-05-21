import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, borderRadius } from '../styles/theme'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'text'
  fullWidth?: boolean
}

export const Button = ({ title, onPress, variant = 'primary', fullWidth = false }: ButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        styles[variant],
        fullWidth && styles.fullWidth,
      ]}
    >
      <Text style={[styles.buttonText, variant === 'secondary' && styles.secondaryText]}>
        {title}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.xs,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  secondaryText: {
    color: colors.text,
  },
  fullWidth: {
    width: '100%',
  },
})
