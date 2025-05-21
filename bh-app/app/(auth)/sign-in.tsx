import { useSignIn } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Text, View, StyleSheet } from 'react-native'
import React from 'react'
import { Container } from '../components/Container'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { colors, spacing } from '../styles/theme'

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')

  const onSignInPress = async () => {
    if (!isLoaded) return
    setError('')

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/')
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2))
        setError('Unable to sign in. Please check your credentials.')
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
      setError('An error occurred during sign in.')
    }
  }

  return (
    <Container style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
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
          placeholder="Enter your password"
          secureTextEntry={true}
          onChangeText={setPassword}
        />
        
        <Button
          title="Sign In"
          onPress={onSignInPress}
          fullWidth
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <Link href="/sign-up" asChild>
          <Text style={styles.link}>Sign up</Text>
        </Link>
      </View>
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  form: {
    width: '100%',
    marginBottom: spacing.xl,
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
    fontWeight: '500',
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
})