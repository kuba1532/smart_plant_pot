import { Stack } from 'expo-router/stack'
import { colors } from '@/app/styles/theme';

export default function Layout() {
  return <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.secondary }, // Beige header
        headerTintColor: colors.text, // Dark brown text for header
        headerTitleStyle: { fontWeight: 'bold' }
      }}
  />
}
