// React hooks para estado local y efectos secundarios (parsear callback en web).
import React, { useEffect, useState } from 'react';
// Componentes base de UI y utilidades visuales de React Native.
import { StyleSheet, Alert, ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
// Utilidades OAuth de Expo para construir redirect URIs y helpers de sesión.
import * as AuthSession from 'expo-auth-session';
// API de navegador embebido/sistema para abrir flujo de autenticación en móvil.
import * as WebBrowser from 'expo-web-browser';
// Helper interno de Expo para generar URL de inicio usando proxy (Expo Go).
import sessionUrlProvider from 'expo-auth-session/build/SessionUrlProvider';
// Detección de plataforma para separar web y móvil.
import { Platform } from 'react-native';
// Componentes tematizados del proyecto.
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthSessionUser, setAuthSessionUser } from '@/services/authSession';

// Completa sesiones pendientes cuando la app vuelve del navegador (especialmente útil en OAuth).
WebBrowser.maybeCompleteAuthSession();

// Configuración base de Auth0.
const AUTH0_DOMAIN = 'dev-ecmx143cjy36oshj.us.auth0.com';
const AUTH0_CLIENT_ID = 'JDRWSan8BqKkpWlGH5IutSE4ZXnyllNF';
// Si se define audience, Auth0 entregará access token para esa API.
// En este momento va vacío para evitar el error "client is not authorized to access resource server".
const AUTH0_AUDIENCE = '';

// Expo Go proxy project name
const PROJECT_NAME_FOR_PROXY = '@theicedk/valle-del-sol';
// Obtenemos la URL de retorno estándar (en móvil) sin usar el proxy obsoleto.
// Esto resolverá dinámicamente valledelsol://login o exp://...
const RETURN_URL = AuthSession.makeRedirectUri({ path: 'login' });
// For web we want a non-proxy redirect URI that maps to the router path
const RETURN_URL_WEB = Platform.OS === 'web' && typeof window !== 'undefined'
  ? `${window.location.origin}/login`
  : AuthSession.makeRedirectUri({ path: 'login' });

const getUsernameFromEmail = (email: string) => email.split('@')[0];

export default function LoginScreen() {
  // Estado de carga para mostrar spinner durante autenticación móvil.
  const [loading, setLoading] = useState(false);
  // Simulación de usuario autenticado (demo); aquí luego puedes guardar tokens reales.
  const [userInfo, setUserInfo] = useState<any>(() => getAuthSessionUser());

  // Efecto que procesa el callback en WEB cuando Auth0 redirige con parámetros en query string.
  useEffect(() => {
    // En móvil no aplicamos este parseo porque el flujo retorna por `openAuthSessionAsync`.
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    // Si ya existe una sesión guardada, la recupera al refrescar la página.
    // Así el usuario no pierde el estado de login al recargar.
    const persistedUser = getAuthSessionUser();
    if (persistedUser && !userInfo) {
      setUserInfo(persistedUser);
      return;
    }

    // URL actual luego del retorno de Auth0, por ejemplo: /login?code=...&state=...
    const currentUrl = new URL(window.location.href);
    const code = currentUrl.searchParams.get('code');
    const error = currentUrl.searchParams.get('error');
    const errorDescription = currentUrl.searchParams.get('error_description');

    // Si Auth0 devuelve error en query params, se notifica al usuario y se termina.
    if (error) {
      Alert.alert('Error de Auth0', errorDescription || error, [{ text: 'Cerrar' }]);
      return;
    }

    // Si no hay code o ya hay sesión local cargada, no hacemos nada.
    if (!code || userInfo) {
      return;
    }

    // Se guarda resultado de login (demo). Aquí luego puede ir intercambio `code -> tokens`.
    setUserInfo({
      email: 'usuario@auth0.com',
    });
    // Sincroniza la sesión compartida para que otras pantallas sepan que ya hay usuario logueado.
    setAuthSessionUser({ email: 'usuario@auth0.com' });

    // Limpieza de query params sensibles para dejar la URL limpia en barra del navegador.
    currentUrl.searchParams.delete('code');
    currentUrl.searchParams.delete('state');
    currentUrl.searchParams.delete('error');
    currentUrl.searchParams.delete('error_description');
    window.history.replaceState({}, '', currentUrl.toString());
    Alert.alert('Éxito', 'Has iniciado sesión correctamente', [{ text: 'OK' }]);
  }, [userInfo]);

  // Handler principal del botón "INICIAR SESIÓN CON AUTH0".
  const handleLogin = async () => {
    try {
      // Flujo WEB: redirección directa en la misma pestaña hacia endpoint /authorize de Auth0.
      if (Platform.OS === 'web') {
        // Incluye audience solo si está definido para evitar errores de autorización.
        const audienceParam = AUTH0_AUDIENCE
          ? `&audience=${encodeURIComponent(AUTH0_AUDIENCE)}`
          : '';

        // On web, redirect directly to Auth0 with a web redirect URI
        const webAuthUrl =
          `https://${AUTH0_DOMAIN}/authorize?` +
          `client_id=${AUTH0_CLIENT_ID}` +
          `&redirect_uri=${encodeURIComponent(RETURN_URL_WEB)}` +
          `&response_type=code` +
          `&scope=openid profile email` +
          audienceParam;

        // navigate immediately in the same tab (more reliable on web)
        if (typeof window !== 'undefined') {
          window.open(webAuthUrl, '_self');
        }
        return;
      }

      // Flujo MÓVIL (Expo Go o Standalone): usa navegador/sesión proxy nativo y regresa a la app.
      setLoading(true);

      const authUrl =
        `https://${AUTH0_DOMAIN}/authorize?` +
        `client_id=${AUTH0_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(RETURN_URL)}` +
        `&response_type=code` +
        `&scope=openid profile email`;

      console.log('Debes agregar esta URL en Auth0 Callback URLs de móvil:', RETURN_URL);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, RETURN_URL);
      console.log('Auth result:', result);

      // Si usuario cierra/cancela navegador, no se considera éxito.
      if (result.type !== 'success') {
        Alert.alert('Login cancelado', 'No se completó la autenticación');
        return;
      }

      // Parsea parámetros devueltos por Auth0 tras autenticación.
      const parsedUrl = new URL((result as any).url);
      const code = parsedUrl.searchParams.get('code');
      const error = parsedUrl.searchParams.get('error');
      const errorDescription = parsedUrl.searchParams.get('error_description');

      if (error) {
        Alert.alert('Error de Auth0', errorDescription || error, [{ text: 'Cerrar' }]);
        return;
      }

      if (code) {
        setUserInfo({
          email: 'usuario@auth0.com',
        });
        // Repite la sincronización en móvil después del retorno de Auth0.
        setAuthSessionUser({ email: 'usuario@auth0.com' });
        Alert.alert('Éxito', 'Has iniciado sesión correctamente', [{ text: 'OK' }]);
        return;
      }

      Alert.alert('Login', 'No se recibió un código de autorización');
    } catch (error: any) {
      // Manejo de excepciones inesperadas del flujo.
      Alert.alert('Error', error.message || 'Error al intentar iniciar sesión');
    } finally {
      // Siempre apagamos loading al finalizar el intento.
      setLoading(false);
    }
  };

  // Limpia sesión local simulada.
  const handleLogout = () => {
    // Limpia la sesión local de esta pantalla.
    setUserInfo(null);
    // Limpia también la sesión compartida para que el resto de la app quede en modo anónimo.
    setAuthSessionUser(null);
    Alert.alert('Sesión cerrada', 'Has cerrado tu sesión correctamente');
  };

  // Estado visual durante autenticación móvil.
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Autenticando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // UI principal: cambia entre modo "logueado" y "sin sesión" según `userInfo`.
  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {userInfo ? 'Mi Sesión' : 'Iniciar Sesión'}
        </ThemedText>

        {userInfo ? (
          // Vista autenticada (muestra datos de sesión demo).
          <View style={styles.userContainer}>
            <View style={styles.userHeader}>
              <IconSymbol name="person.fill" size={28} color={Colors.primary} />
              <ThemedText style={styles.welcomeText}>
                ¡Bienvenido, {getUsernameFromEmail(userInfo.email)}!
              </ThemedText>
            </View>
            <View style={styles.infoBox}>
              <ThemedText style={styles.label}>Email:</ThemedText>
              <ThemedText style={styles.infoText}>{userInfo.email}</ThemedText>

              <ThemedText style={styles.label}>Usuario:</ThemedText>
              <ThemedText style={styles.infoText}>{getUsernameFromEmail(userInfo.email)}</ThemedText>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.buttonText}>CERRAR SESIÓN</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Vista no autenticada (muestra botón de login + bloque de diagnóstico).
          <View style={styles.loginContainer}>
            <ThemedText style={styles.subtitle}>
              Inicia sesión con Auth0 para acceder a todas las funciones de la app.
            </ThemedText>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={styles.buttonText}>INICIAR SESIÓN CON AUTH0</Text>
            </TouchableOpacity>

          </View>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    marginBottom: 20,
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    marginBottom: 30,
    lineHeight: 24,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.onBackground,
    fontSize: 16,
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: '100%',
  },
  buttonText: {
    color: Colors.onPrimary,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  userContainer: {
    alignItems: 'center',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  infoBox: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontWeight: '700',
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 12,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.onBackground,
  },
  logoutButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    elevation: 4,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});