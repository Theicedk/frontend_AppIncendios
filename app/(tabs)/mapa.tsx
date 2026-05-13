import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/Colors';
import { useFocusEffect } from 'expo-router';
// eslint-disable-next-line import/no-unresolved
import { FormularioReporte } from '@valle-del-sol/reporte-module';
import { enviarReporte, fetchFocos, fetchReportes, ReporteDTO, FocoMapaDTO, ReporteListaDTO } from '@/services/apiGateway';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UbicacionContext } from '../../context/UbicacionContext';

export default function MapaScreen() {
  const webViewRef = useRef<WebView>(null);
  const ubicacionContext = useContext(UbicacionContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [focos, setFocos] = useState<FocoMapaDTO[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [reportes, setReportes] = useState<ReporteListaDTO[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentFocos = async () => {
    try {
      const [focosData, reportesData] = await Promise.all([
        fetchFocos(),
        fetchReportes()
      ]);
      setFocos(focosData);
      setReportes(reportesData);
      
      if (webViewRef.current) {
        // En lugar de llamar a clearSelectedMarker() sin verificar si existe, 
        // pasamos los focos y actualizamos los puntos del mapa siempre.
        webViewRef.current.injectJavaScript(`
          if (typeof window.clearSelectedMarker === 'function') window.clearSelectedMarker(); 
          if (typeof window.agregarFocos === 'function') window.agregarFocos('${JSON.stringify(focosData)}');
        `);
      }
    } catch (err: any) {
      console.error('Error actualizando focos:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      setError(null);
      try {
        const [focosData, reportesData] = await Promise.all([
          fetchFocos(),
          fetchReportes()
        ]);
        setFocos(focosData);
        setReportes(reportesData);
        // La inyección inicial se hace vía injectedJavaScriptBeforeContentLoaded o el ref una vez cargado
      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos');
      } finally {
        setDataLoading(false);
      }
    };
    
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!dataLoading) { // Solo refetch si ya cargó inicialmente
        fetchCurrentFocos();
      }
    }, [dataLoading])
  );

  const handleReportSubmit = async (data: ReporteDTO) => {
    try {
      setLoading(true);
      await enviarReporte(data);
      Alert.alert('Éxito', 'Reporte enviado al sistema central.');
      setModalVisible(false);
      
      // Asegurar que el punto quede fijo refetching los focos (o reportes de este dashboard) 
      // y pidiendo al webview que actualice y remueva la marca temporal
      await fetchCurrentFocos();
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar el reporte');
    } finally {
      setLoading(false);
    }
  };

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
        {dataLoading ? (
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
              style={styles.webview}
              injectedJavaScriptBeforeContentLoaded={`window.agregarFocos('${JSON.stringify(focos)}')`}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onMessage={onMessage}
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
