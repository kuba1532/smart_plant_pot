// app/components/SignOutButton.tsx (updated)
import { useClerk } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { Button } from './Button'

export const SignOutButton = () => {
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    try {
      await signOut()
      Linking.openURL(Linking.createURL('/'))
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }

  return <Button title="Sign out" onPress={handleSignOut} variant="secondary" />
}