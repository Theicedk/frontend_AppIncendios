import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { FormularioReporte } from '@valle-del-sol/reporte-module';
import { enviarReporte, ReporteDTO, FocoMapaDTO, ReporteListaDTO, fetchDashboardCombinado } from '@/services/apiGateway';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UbicacionContext } from '../../context/UbicacionContext';
import { isAuthenticated } from '@/services/authSession';
import { useRouter } from 'expo-router';

const IS_WEB = Platform.OS === 'web';

// ─── Helpers de comunicación con el mapa ─────────────────────
function injectFocos(mapRef: React.MutableRefObject<any>, focosJson: string) {
  if (IS_WEB) {
    mapRef.current?.contentWindow?.postMessage({ type: 'AGREGAR_FOCOS', payload: focosJson }, '*');
  } else {
    mapRef.current?.injectJavaScript?.(`
      var datos = ${focosJson};
      if (window.agregarFocos) { window.agregarFocos(JSON.stringify(datos)); }
      true;
    `);
  }
}

function injectGPS(mapRef: React.MutableRefObject<any>, lat: number, lng: number) {
  if (IS_WEB) {
    mapRef.current?.contentWindow?.postMessage({ type: 'ACTUALIZAR_GPS', lat, lng }, '*');
  } else {
    mapRef.current?.injectJavaScript?.(`actualizarPuntoAzul(${lat}, ${lng}); true;`);
  }
}

// ─── Pantalla ────────────────────────────────────────────────
export default function MapaScreen() {
  const mapRef = useRef<any>(null);
  const ubicacionContext = useContext(UbicacionContext);
  const locationWatchRef = useRef<number | (() => void) | null>(null);
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focos, setFocos] = useState<(FocoMapaDTO | ReporteListaDTO)[]>([]);
  const [reportes, setReportes] = useState<ReporteListaDTO[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapaListo, setMapaListo] = useState(false);

  const isMapReady = useRef<boolean>(false);
  const lastLocation = useRef<{ latitude: number; longitude: number } | null>(null);

  // ─── Cargar datos del backend ──────────────────────────────
  const cargarDatosDelMapa = async () => {
    setDataLoading(true);
    setError(null);
    try {
      const dashboardData = await fetchDashboardCombinado();

      const todosLosPuntos = [
        ...(dashboardData.focos || []),
        ...(dashboardData.reportes || []),
      ].reverse();

      setFocos(todosLosPuntos);
      setReportes(dashboardData.reportes.reverse());
    } catch (err: any) {
      setError('Error al cargar datos del mapa.');
    } finally {
      setDataLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => { cargarDatosDelMapa(); }, [])
  );

  // ─── Inyectar focos cuando el mapa y los datos están listos ─
  useEffect(() => {
    if (mapaListo && mapRef.current && focos.length > 0) {
      injectFocos(mapRef, JSON.stringify(focos));
    }
  }, [focos, mapaListo]);

  // ─── GPS (nativo: expo-location / web: navigator.geolocation)
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (IS_WEB) {
      if (!('geolocation' in navigator)) return;
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          lastLocation.current = { latitude, longitude };
          if (isMapReady.current) injectGPS(mapRef, latitude, longitude);
        },
        (err) => console.warn('GPS web:', err.message),
        { enableHighAccuracy: true }
      );
      cleanup = () => navigator.geolocation.clearWatch(watchId);
    } else {
      const iniciarGPS = async () => {
        const Location = require('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5 },
          (location: any) => {
            const { latitude, longitude } = location.coords;
            lastLocation.current = { latitude, longitude };
            if (isMapReady.current) injectGPS(mapRef, latitude, longitude);
          }
        );
        cleanup = () => sub?.remove?.();
      };
      iniciarGPS();
    }

    return () => cleanup?.();
  }, []);

  // ─── Enviar reporte ────────────────────────────────────────
  const handleReportSubmit = async (data: ReporteDTO) => {
    const autenticado = await isAuthenticated();
    if (!autenticado) {
      setModalVisible(false);
      setShowLoginModal(true);
      return;
    }
    try {
      setLoading(true);
      await enviarReporte(data);
      Alert.alert('Éxito', 'Reporte enviado al sistema central.');
      setModalVisible(false);
      await cargarDatosDelMapa();
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('sesión')) {
        setModalVisible(false);
        setShowLoginModal(true);
      } else {
        Alert.alert('Error', error.message || 'No se pudo enviar el reporte');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Recibir mensajes del mapa (coordenadas de tap) ────────
  useEffect(() => {
    if (!IS_WEB) return;

    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.tipo === 'NUEVA_UBICACION' && ubicacionContext) {
          ubicacionContext.setUbicacion(data.lat, data.lng);
        }
      } catch { /* ignorar */ }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [ubicacionContext]);

  const onNativeMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.tipo === 'NUEVA_UBICACION' && ubicacionContext) {
          ubicacionContext.setUbicacion(data.lat, data.lng);
        }
      } catch { /* ignorar */ }
    },
    [ubicacionContext]
  );

  // ─── Al cargar el mapa ─────────────────────────────────────
  const handleMapLoad = useCallback(() => {
    isMapReady.current = true;
    setMapaListo(true);
    setTimeout(() => {
      const loc = lastLocation.current;
      if (loc) injectGPS(mapRef, loc.latitude, loc.longitude);
    }, 200);
  }, []);

  // ─── UI ─────────────────────────────────────────────────────
  if (dataLoading && focos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        {IS_WEB ? (
          <iframe
            ref={mapRef}
            src={require('../../assets/mapa.html')}
            style={{ width: '100%', height: '100%', border: 'none' }}
            onLoad={handleMapLoad}
          />
        ) : (
          <MapaNativo mapRef={mapRef} onMessage={onNativeMessage} onLoad={handleMapLoad} />
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <IconSymbol name="exclamationmark.triangle.fill" size={24} color={Colors.onPrimary} />
        <Text style={styles.fabText}>Reportar</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Enviando reporte...</Text>
              </View>
            ) : (
              <FormularioReporte onSubmit={handleReportSubmit} />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={showLoginModal}
        animationType="fade"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.loginModalBackdrop}>
          <View style={styles.loginModalCard}>
            <Text style={styles.loginModalTitle}>Necesitas iniciar sesión</Text>
            <Text style={styles.loginModalMessage}>
              Para crear un reporte de incendio debes iniciar sesión primero.
            </Text>
            <View style={styles.loginModalActions}>
              <TouchableOpacity
                style={[styles.loginModalButton, styles.loginSecondaryButton]}
                onPress={() => setShowLoginModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.loginSecondaryButtonText}>CERRAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginModalButton, styles.loginPrimaryButton]}
                onPress={() => {
                  setShowLoginModal(false);
                  router.push('/login');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.loginPrimaryButtonText}>IR A INICIAR SESIÓN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Subcomponente nativo (evita cargar react-native-webview en web) ─
function MapaNativo({ mapRef, onMessage, onLoad }: {
  mapRef: React.MutableRefObject<any>;
  onMessage: (event: any) => void;
  onLoad: () => void;
}) {
  const { WebView } = require('react-native-webview');
  const MAP_HTML = require('../../assets/mapa.html');
  return (
    <WebView
      ref={mapRef}
      source={MAP_HTML}
      style={styles.webviewNative as any}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      onMessage={onMessage}
      onLoadEnd={onLoad}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapContainer: { flex: 1 },
  webviewNative: { flex: 1 },
  centerContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: { color: Colors.error, fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: Colors.onSurface },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 28,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
  fabText: { color: Colors.onPrimary, fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 16, paddingBottom: 32, minHeight: '60%',
  },
  closeButton: { alignSelf: 'flex-end', padding: 8, marginBottom: 8 },
  closeButtonText: { fontSize: 20, fontWeight: 'bold', color: Colors.onSurfaceVariant },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  loginModalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  loginModalCard: {
    width: '100%', maxWidth: 420, backgroundColor: Colors.background,
    borderRadius: 20, padding: 22,
  },
  loginModalTitle: {
    color: Colors.onBackground, fontSize: 18, fontWeight: 'bold',
    marginBottom: 10, textAlign: 'center',
  },
  loginModalMessage: {
    color: Colors.onSurfaceVariant, textAlign: 'center',
    lineHeight: 22, marginBottom: 20,
  },
  loginModalActions: { flexDirection: 'row', gap: 12 },
  loginModalButton: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  loginSecondaryButton: { backgroundColor: Colors.surfaceVariant },
  loginPrimaryButton: { backgroundColor: Colors.primary },
  loginSecondaryButtonText: { color: Colors.onSurface, fontWeight: '800', fontSize: 13 },
  loginPrimaryButtonText: { color: Colors.onPrimary, fontWeight: '800', fontSize: 13 },
});
