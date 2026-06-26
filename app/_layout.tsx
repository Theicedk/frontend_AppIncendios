import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { UbicacionProvider } from '../context/UbicacionContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Estado para saber si la aplicación está lista para renderizar
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const verificarSesionPersistente = async () => {
      try {
        // 1. Revisamos si el usuario dejó su token guardado la última vez
        const token = await SecureStore.getItemAsync('access_token');
        const perfilGuardado = await SecureStore.getItemAsync('perfil_usuario');
        
        if (token && perfilGuardado) {
          // Si hay token, lo mandamos directo a la app (Index)
          // Usamos un pequeño setTimeout para darle tiempo a Expo Router de montarse
          setTimeout(() => router.replace('/'), 100); 
        } else {
          // Si no hay token (o cerró sesión), lo mandamos al Login
          setTimeout(() => router.replace('/login'), 100);
        }
      } catch (error) {
        console.error("Error al leer la sesión guardada:", error);
        router.replace('/login'); // Por seguridad, si hay error, al login
      } finally {
        setIsReady(true); // Ya terminamos de revisar
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
