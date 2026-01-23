import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get tokens from URL params (set by OAuth redirect)
        const accessToken = params.access_token as string | undefined;
        const refreshToken = params.refresh_token as string | undefined;

        if (accessToken && refreshToken) {
          // Set the session in Supabase
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            router.replace('/(auth)/sign-in');
            return;
          }

          // Successfully authenticated, go to main app
          router.replace('/(tabs)');
        } else {
          // No tokens, redirect to sign in
          console.log('No tokens in callback URL');
          router.replace('/(auth)/sign-in');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/(auth)/sign-in');
      }
    }

    handleCallback();
  }, [params, router]);

  return (
    <View style={styles.container}>
      <LoadingSpinner size="large" />
      <Text style={styles.text}>Signing you in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
