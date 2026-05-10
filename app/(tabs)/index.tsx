import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { fetchFocos, fetchReportes, FocoMapaDTO, ReporteListaDTO } from '@/services/apiGateway';
import { Colors } from '@/constants/Colors';

export default function MapaScreen() {
  const [focos, setFocos] = useState<FocoMapaDTO[]>([]);
  const [reportes, setReportes] = useState<ReporteListaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [focosData, reportesData] = await Promise.all([
        fetchFocos(),
        fetchReportes()
      ]);
      
      setFocos(focosData);
      setReportes(reportesData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando datos...</Text>
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

  const renderFoco = ({ item }: { item: FocoMapaDTO }) => {
    const isActivo = item.estado?.toUpperCase() === 'ACTIVO';
    
    return (
      <View style={[styles.card, isActivo && styles.cardActive]}>
        <Text style={styles.cardTitle}>Foco #{item.id}</Text>
        <Text style={styles.cardText}>Latitud: {item.latitud}</Text>
        <Text style={styles.cardText}>Longitud: {item.longitud}</Text>
        <Text style={[styles.cardStatus, isActivo && styles.statusActive]}>
          Estado: {item.estado}
        </Text>
      </View>
    );
  };

  const renderHistorialReportes = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Historial de Reportes</Text>
      {reportes.length === 0 ? (
        <Text style={styles.emptyText}>No hay reportes recientes.</Text>
      ) : (
        reportes.map(reporte => (
          <View key={`reporte-${reporte.id}`} style={styles.card}>
            <Text style={styles.cardTitle}>Reporte #{reporte.id}</Text>
            <Text style={styles.cardText}>{reporte.descripcion}</Text>
            <Text style={styles.cardText}>Ubicación: {reporte.latitud}, {reporte.longitud}</Text>
            {reporte.estado && (
              <Text style={styles.cardText}>Estado: {reporte.estado}</Text>
            )}
          </View>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={focos}
        keyExtractor={(item) => `foco-${item.id}`}
        renderItem={renderFoco}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Focos Detectados</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay focos registrados.</Text>}
        ListFooterComponent={renderHistorialReportes}
      />
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.onBackground,
    fontSize: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.onBackground,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    paddingTop: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardActive: {
    borderColor: Colors.error,
    borderWidth: 2,
    backgroundColor: Colors.errorContainer,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  cardStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  statusActive: {
    color: Colors.error,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});