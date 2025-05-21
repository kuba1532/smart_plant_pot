// app/(home)/index.tsx
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { Text, View, StyleSheet, Platform } from 'react-native' // Added Platform
import { SignOutButton } from '@/app/components/SignOutButton'
import { Container } from '@/app/components/Container'
import { Button } from '@/app/components/Button'
import { Link } from 'expo-router'
import { colors, spacing } from '@/app/styles/theme'
import { UserDevices } from '@/app/components/UserDevices'; // Import the new component

export default function Page() {
  const { user } = useUser()

  return (
      <Container style={styles.container}>
        <SignedIn>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.emailText}>{user?.emailAddresses[0].emailAddress}</Text>

            <UserDevices />

            <View style={styles.buttonContainer}>
              <SignOutButton />
            </View>
          </View>
        </SignedIn>

        <SignedOut>
          <View style={styles.signedOutContainer}>
            <Text style={styles.signedOutTitle}>
              You need to sign in to view this page
            </Text>

            <View style={styles.buttonGroup}>
              <Link href="/(auth)/sign-in" asChild>
                <Button title="Sign In" variant="primary" />
              </Link>

              <Link href="/(auth)/sign-up" asChild>
                <Button title="Create Account" variant="secondary" />
              </Link>
            </View>
          </View>
        </SignedOut>
      </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    // justifyContent: 'center', // Remove if UserDevices is scrollable and needs top alignment
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? spacing.lg : 0, // Adjust for status bar on Android if needed
  },
  welcomeContainer: {
    width: '100%',
    alignItems: 'center',
    flex: 1, // Allow this container to take up space for scrolling UserDevices
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md, // Add some top margin
  },
  emailText: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: spacing.md, // Reduced margin as UserDevices will take space
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  cardText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 'auto', // Push sign out button to bottom if welcomeContainer is flex:1
    paddingBottom: spacing.lg, // Ensure some padding at the bottom
    width: '90%', // Match width of other content
    alignSelf: 'center'
  },
  signedOutContainer: {
    flex: 1, // Ensure it centers vertically
    alignItems: 'center',
    justifyContent: 'center',
  },
  signedOutTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: spacing.xl,
    color: colors.text,
    textAlign: 'center',
  },
  buttonGroup: {
    gap: spacing.md,
    alignItems: 'center',
  },
})
