import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { UbicacionProvider } from '../context/UbicacionContext';
import { getItem } from '../services/storage';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const verificarSesionPersistente = async () => {
      try {
        const token = await getItem('access_token');
        const perfilGuardado = await getItem('perfil_usuario');

        const destino = token && perfilGuardado ? '/' : '/login';
        setTimeout(() => router.replace(destino), 100);
      } catch (error) {
        console.error("Error al leer la sesión guardada:", error);
        setTimeout(() => router.replace('/login'), 100);
      } finally {
        setIsReady(true);
      }
    };

    verificarSesionPersistente();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <UbicacionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </UbicacionProvider>
    </SafeAreaView>
  );
}
