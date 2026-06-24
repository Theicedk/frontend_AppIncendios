import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/Colors';
import { useFocusEffect } from 'expo-router';
// eslint-disable-next-line import/no-unresolved
import { FormularioReporte } from '@valle-del-sol/reporte-module';
import { enviarReporte, fetchFocos, fetchReportes, ReporteDTO, FocoMapaDTO, ReporteListaDTO, fetchDashboardCombinado } from '@/services/apiGateway';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UbicacionContext } from '../../context/UbicacionContext';
import * as Location from 'expo-location';

export default function MapaScreen() {
  const webViewRef = useRef<WebView>(null);
  const ubicacionContext = useContext(UbicacionContext);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [focos, setFocos] = useState<FocoMapaDTO[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [reportes, setReportes] = useState<ReporteListaDTO[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapaListo, setMapaListo] = useState(false);

  const isMapReady = useRef<boolean>(false);
  const lastLocation = useRef<{latitude: number, longitude: number} | null>(null);
  
// ==========================================
  // 1. FUNCIÓN COMPARTIDA PARA CARGAR EL MAPA
  // ==========================================
  const cargarDatosDelMapa = async () => {
    const dashboardData = await fetchDashboardCombinado();
      
      // 🚨 EL SUERO DE LA VERDAD: Imprime todo el objeto crudo en la terminal
      console.log("🕵️‍♂️ DATOS CRUDOS:", JSON.stringify(dashboardData, null, 2));
    setDataLoading(true);
    setError(null);
    try {
      console.log("📥 [UI] Descargando datos...");
      const dashboardData = await fetchDashboardCombinado();
      
      const focosVerificados = (dashboardData.focos || []).filter(
        (f: any) => f.verificado === true
      );
      const reportesVerificados = (dashboardData.reportes || []).filter(
        (r: any) => r.verificado === true
      );

      const puntosVerificados = [...focosVerificados, ...reportesVerificados];
      console.log(`🔥 [UI] Puntos verificados para el mapa: ${puntosVerificados.length}`);
      
      // SOLUCIÓN AL ERROR 1: Agregamos "as any[]" para evitar el error de TypeScript
      setFocos(puntosVerificados.reverse() as any[]);
      setReportes(dashboardData.reportes.reverse() as any[]);
    } catch (err: any) {
      console.error("❌ [UI] Error:", err.message);
      setError('Error al cargar datos del mapa.');
    } finally {
      setDataLoading(false);
    }
  };

  // ==========================================
  // 2. EL DESCARGADOR AUTOMÁTICO (useFocusEffect)
  // ==========================================
  useFocusEffect(
    React.useCallback(() => {
      // Solo llama a la función de arriba cuando entras a la pantalla
      cargarDatosDelMapa();
    }, [])
  );

  // ... (AQUÍ SE QUEDA TU useEffect INYECTOR DEL MAPA INTACTO) ...
useEffect(() => {
    // Solo enviamos los datos si el WebView ya cargó y tenemos puntos verificados
    if (mapaListo && webViewRef.current && focos.length > 0) {
      console.log(`🚀 [Puente] Inyectando ${focos.length} puntos al mapa HTML`);
      
      // 1. Convertimos tus focos a texto JSON
      const datosGenerados = JSON.stringify(focos);
      
      // 2. Armamos el script que llama a TU función window.agregarFocos
      // Ojo: Tu HTML usa JSON.parse(), así que se lo mandamos como string
      const inyeccionJS = `
        var datos = ${datosGenerados};
        if (window.agregarFocos) {
           window.agregarFocos(JSON.stringify(datos));
        }
        true; // Retorno obligatorio para evitar warnings en Android
      `;
      
      // 3. Disparamos las coordenadas hacia el HTML
      webViewRef.current.injectJavaScript(inyeccionJS);
    }
  }, [focos, mapaListo]);

  // ==========================================
  // 3. EL ENVÍO DEL REPORTE CORREGIDO
  // ==========================================
  const handleReportSubmit = async (data: ReporteDTO) => {
    try {
      setLoading(true);
      await enviarReporte(data);
      Alert.alert('Éxito', 'Reporte enviado al sistema central.');
      setModalVisible(false);

      // SOLUCIÓN AL ERROR 2: Llamamos a la nueva función compartida para refrescar el mapa
      await cargarDatosDelMapa(); 
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar el reporte');
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const iniciarGPS = async () => {
    // TypeScript validará que 'Location' esté importado correctamente
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    // Guardamos la suscripción en nuestra referencia tipada
    locationSubscriptionRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (location) => {
        const { latitude, longitude } = location.coords;
        // Inyectamos de forma segura usando el operador '?' de TypeScript
        console.log("📍 GPS detectado:", latitude, longitude); //
        lastLocation.current = { latitude, longitude };
        if (isMapReady.current) {
          webViewRef.current?.injectJavaScript(`actualizarPuntoAzul(${latitude}, ${longitude}); true;`);
        }
      }
    );
  };

  iniciarGPS();

  // Función de limpieza al cerrar la pantalla
  return () => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
    }
  };
}, []);
  


  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.tipo === 'NUEVA_UBICACION' && ubicacionContext) {
        ubicacionContext.setUbicacion(data.lat, data.lng);
      }
    } catch (error) {
      console.error('Error parsing WebView message', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        {dataLoading && focos.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Cargando mapa...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <WebView
              ref={webViewRef}
              source={require('../../assets/mapa.html')}
              onLoad={() => { isMapReady.current = true; if (lastLocation.current) {const{latitude, longitude} = lastLocation.current; webViewRef.current?.injectJavaScript(`actualizarPuntoAzul(${latitude}, ${longitude}); true;`);}}}
                
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onMessage={onMessage}
              onLoadEnd={() => {
                console.log("✅ [UI] WebView cargó el HTML");
                setMapaListo(true);
              }}
            />
          </>
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
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptyText: {
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: Colors.onPrimary,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
    minHeight: '60%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 8,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.onSurfaceVariant,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.onSurface,
  }
});
