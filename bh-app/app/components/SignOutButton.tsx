// app/components/SignOutButton.tsx (updated)
import { useClerk } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { Button } from './Button'

interface SignOutButtonProps {
  fullWidth?: boolean;
}

export const SignOutButton = ({ fullWidth = false }: SignOutButtonProps) => {
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    try {
      await signOut()
      Linking.openURL(Linking.createURL('/')) // Navigate to root which redirects to sign-in
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }
  return <Button title="Sign out" onPress={handleSignOut} variant="secondary" fullWidth={fullWidth} />
}
