import { SignedIn, SignedOut } from "@clerk/clerk-expo";
import { Link, Redirect } from "expo-router";
import { Text, View, StyleSheet } from "react-native"; // Removed Image as it's not used
import { Button } from "./components/Button";
import { colors, spacing } from "./styles/theme";

export default function Index() {
  return (
      <View style={styles.container}>
        {/* Content for signed-in users */}
        <SignedIn>
          <Redirect href="/(home)" />
        </SignedIn>

        {/* Content for signed-out users */}
        <SignedOut>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>🌱 Welcome to PlantPal! 🌱</Text>
              <Text style={styles.subtitle}>
                Your companion for happy, healthy plants.
              </Text>
            </View>

            <View style={styles.imageContainer}>
              {/* You can add an app logo or illustration here if needed */}
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>🪴</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Link href="/(auth)/sign-in" asChild>
                <Button title="Sign In" variant="primary" fullWidth />
              </Link>

              <Link href="/(auth)/sign-up" asChild>
                <Button title="Create Account" variant="secondary" fullWidth />
              </Link>
            </View>
          </View>
        </SignedOut>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: "center",
  },
  imageContainer: {
    marginBottom: spacing.xl,
    width: "100%",
    alignItems: "center",
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.primaryLight, // Use a light green for the placeholder
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  imagePlaceholderText: {
    // color: colors.primaryDark, // Dark green text on light green background
    // fontWeight: "500",
    fontSize: 60, // Make the emoji larger
  },
  buttonContainer: {
    width: "100%",
    gap: spacing.md,
  },
});
