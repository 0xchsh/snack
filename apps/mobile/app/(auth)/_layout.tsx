import { Stack } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // Redirect to main app if already logged in
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
