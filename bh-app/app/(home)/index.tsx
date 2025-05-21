// app/(home)/index.tsx
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { Text, View, StyleSheet } from 'react-native'
import { SignOutButton } from '@/app/components/SignOutButton'
import { Container } from '@/app/components/Container'
import { Button } from '@/app/components/Button'
import { Link } from 'expo-router'
import { colors, spacing } from '@/app/styles/theme'
import { UserData } from '@/app/components/UserData' // Import the new component

export default function Page() {
  const { user } = useUser()

  return (
    <Container style={styles.container}>
      <SignedIn>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.emailText}>{user?.emailAddresses[0].emailAddress}</Text>
          
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quick Start</Text>
              <Text style={styles.cardText}>
                This is your home screen. You're now signed in with Clerk authentication.
              </Text>
            </View>
          </View>
          
          {/* Add the UserData component here */}
          <UserData />
          
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emailText: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: spacing.xl,
  },
  cardContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    marginTop: spacing.lg,
  },
  signedOutContainer: {
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