// app/_layout.tsx
import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { Slot } from 'expo-router'
import { UserDataProvider } from './context/UserDataContext'

export default function RootLayout() {
    return (
        <ClerkProvider tokenCache={tokenCache}>
            <UserDataProvider>
                <Slot />
            </UserDataProvider>
        </ClerkProvider>
    )
}
