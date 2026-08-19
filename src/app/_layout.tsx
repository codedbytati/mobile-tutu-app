import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, useFonts } from '@expo-google-fonts/poppins';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, Text, TextInput, useColorScheme, View } from 'react-native';

import LoginScreen from '@/app/login';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TransactionProvider } from '@/contexts/TransactionContext';

SplashScreen.preventAutoHideAsync();

const globalTextDefaults = { style: { fontFamily: 'Poppins_400Regular' } };
const TextWithDefaults = Text as typeof Text & { defaultProps?: typeof globalTextDefaults };
const TextInputWithDefaults = TextInput as typeof TextInput & { defaultProps?: typeof globalTextDefaults };
TextWithDefaults.defaultProps = { ...TextWithDefaults.defaultProps, ...globalTextDefaults };
TextInputWithDefaults.defaultProps = { ...TextInputWithDefaults.defaultProps, ...globalTextDefaults };

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#F7F4FF' }} />;
  return (
    <AuthProvider>
      <TransactionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthGate />
        </ThemeProvider>
      </TransactionProvider>
    </AuthProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator accessibilityLabel="Carregando sessão" /></View>;
  }
  if (!user) return <LoginScreen />;
  return <><AnimatedSplashOverlay /><AppTabs /></>;
}
