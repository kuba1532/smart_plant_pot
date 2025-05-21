import { View, StyleSheet, ViewStyle } from 'react-native'
import { colors, spacing } from '../styles/theme'

interface ContainerProps {
  children: React.ReactNode
  style?: ViewStyle
}

export const Container = ({ children, style }: ContainerProps) => {
  return <View style={[styles.container, style]}>{children}</View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
})