import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { FormularioReporte } from '@valle-del-sol/reporte-module';
import { enviarReporte, fetchFocos, fetchReportes, ReporteDTO, FocoMapaDTO, ReporteListaDTO } from '@/services/apiGateway';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function MapaScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [focos, setFocos] = useState<FocoMapaDTO[]>([]);
  const [reportes, setReportes] = useState<ReporteListaDTO[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos');
      } finally {
        setDataLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleReportSubmit = async (data: ReporteDTO) => {
    try {
      setLoading(true);
      await enviarReporte(data);
      Alert.alert('Éxito', 'Reporte enviado a Kafka');
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar el reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {dataLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Cargando datos espaciales...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Focos Detectados</Text>
            {focos.map((foco) => {
              const isActive = foco.estado === 'ACTIVO';
              return (
                <View 
                  key={foco.id} 
                  style={[styles.card, isActive && styles.cardActive]}
                >
                  <Text style={[styles.cardTitle, isActive && styles.textActive]}>
                    Foco #{foco.id} - {foco.estado}
                  </Text>
                  <Text style={styles.cardCoord}>Lat: {foco.latitud}</Text>
                  <Text style={styles.cardCoord}>Lon: {foco.longitud}</Text>
                </View>
              );
            })}

            {focos.length === 0 && (
              <Text style={styles.emptyText}>No hay focos registrados.</Text>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Últimos Reportes</Text>
            {reportes.map((reporte) => (
              <View key={reporte.id} style={styles.card}>
                <Text style={styles.cardDesc}>{reporte.descripcion}</Text>
                <Text style={styles.cardState}>
                  Estado: {reporte.estado || 'Recibido'}
                </Text>
                <Text style={styles.cardCoord}>Lat: {reporte.latitud}</Text>
                <Text style={styles.cardCoord}>Lon: {reporte.longitud}</Text>
              </View>
            ))}

            {reportes.length === 0 && (
              <Text style={styles.emptyText}>No hay reportes recientes.</Text>
            )}
            
            {/* Espacio extra al final para que el FAB no tape contenido */}
            <View style={{ height: 80 }} />
          </>
        )}
      </ScrollView>

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
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.primaryContainer,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardActive: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorContainer,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.onPrimaryContainer,
    marginBottom: 8,
  },
  textActive: {
    color: Colors.error,
  },
  cardDesc: {
    fontSize: 16,
    color: Colors.onPrimaryContainer,
    marginBottom: 4,
    fontWeight: '500',
  },
  cardState: {
    fontSize: 14,
    color: Colors.onPrimaryContainer,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardCoord: {
    fontSize: 14,
    color: Colors.onPrimaryContainer,
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
