// app/(home)/index.tsx
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { Text, View, StyleSheet, Platform } from 'react-native' // Added Platform
import { SignOutButton } from '@/app/components/SignOutButton'
import { Container } from '@/app/components/Container'
import { Button } from '@/app/components/Button'
import {Link, Stack} from 'expo-router'
import { colors, spacing } from '@/app/styles/theme'
import { UserDevices } from '@/app/components/UserDevices';
import React from "react"; // Import the new component


export default function Page() {
  const { user } = useUser()

  const BOTTOM_BAR_TOP_PADDING = spacing.sm; // Consistent with device actions button bar
  const BUTTON_ESTIMATED_HEIGHT = 50; // Estimate based on Button styles (paddingVertical: spacing.md*2 + fontSize)
  const BOTTOM_BAR_NAV_PADDING_IOS = spacing.xl;
  const BOTTOM_BAR_NAV_PADDING_ANDROID = spacing.lg;

  const bottomBarHeight = BOTTOM_BAR_TOP_PADDING + BUTTON_ESTIMATED_HEIGHT +
      (Platform.OS === 'ios' ? BOTTOM_BAR_NAV_PADDING_IOS : BOTTOM_BAR_NAV_PADDING_ANDROID);

  const scrollContentPaddingBottom = bottomBarHeight + spacing.md; // Add a little extra margin

  return (
      <Container style={styles.container}>
        <Stack.Screen options = {{title:"Home"}}/>
        <SignedIn>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome Back,</Text>
            <Text style={styles.emailText}>{user?.emailAddresses[0].emailAddress}</Text>
            <UserDevices contentContainerStyle={{ paddingBottom: scrollContentPaddingBottom }} />
          </View>
          <View style={styles.bottomBar}>
            <SignOutButton fullWidth />
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
    paddingTop: Platform.OS === 'android' ? spacing.lg : 0, // Keep existing status bar adjustment
// padding: 0 // Main container might not need its own padding if children handle it
  },
  welcomeContainer: {
    width: '100%',
    flex: 1, // Allow this container to take up space for scrolling UserDevices
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryDark, // Use a darker green for emphasis
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl, // Align content with Container's typical padding
    paddingTop: spacing.md,      // Consistent small top padding
    paddingBottom: Platform.OS === 'ios' ? spacing.sl : spacing.xxl, // For home indicator/nav bar
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.00,
    elevation: 5,
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
