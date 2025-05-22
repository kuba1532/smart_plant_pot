import * as React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Container } from '../components/Container'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { colors, spacing } from '../styles/theme'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState('')

  const onSignUpPress = async () => {
    if (!isLoaded) return
    setError('')

    try {
      await signUp.create({
        emailAddress,
        password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
      setError('An error occurred during sign up.')
    }
  }

  const onVerifyPress = async () => {
    if (!isLoaded) return
    setError('')

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/')
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2))
        setError('Verification failed. Please try again.')
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
      setError('An error occurred during verification.')
    }
  }

  if (pendingVerification) {
    return (
        <Container style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify Your Email 📧</Text>
            <Text style={styles.subtitle}>We've sent a code to your email address.</Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.form}>
            <Input
                label="Verification Code"
                value={code}
                placeholder="Enter the code sent to your email"
                onChangeText={setCode}
            />

            <Button
                title="Verify Email"
                onPress={onVerifyPress}
                fullWidth
            />
          </View>
        </Container>
    )
  }

  return (
      <Container style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us and get started!</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.form}>
          <Input
              label="Email"
              value={emailAddress}
              placeholder="Enter your email"
              onChangeText={setEmailAddress}
          />

          <Input
              label="Password"
              value={password}
              placeholder="Create a password"
              secureTextEntry={true}
              onChangeText={setPassword}
          />

          <Button
              title="Sign Up"
              onPress={onSignUpPress}
              fullWidth
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/sign-in" asChild>
            <Text style={styles.link}>Sign in</Text>
          </Link>
        </View>
      </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  form: {
    width: '100%',
    marginBottom: spacing.xl,
    maxWidth: 400, // Optional: constrain form width on larger screens
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.textLight,
    marginRight: spacing.xs,
  },
  link: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
})
