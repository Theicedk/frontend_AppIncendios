import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchDashboardCombinado, FocoMapaDTO, ReporteListaDTO } from '@/services/apiGateway';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MapaScreen() {
  const router = useRouter();
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
      
      const dashboardData = await fetchDashboardCombinado();
      
      setFocos(dashboardData.focos.reverse());
      setReportes(dashboardData.reportes.reverse());
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
        <Text style={styles.loadingText}>CARGANDO TABLERO...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={cargarDatos} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>REINTENTAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const focosActivos = focos.filter((f) => f.estado?.toUpperCase() === 'ACTIVO').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topAppBar}>
        <Text style={styles.appBarTitle}>Valle del Sol</Text>
        <View style={styles.badgeContainer}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>VIGILANCIA</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderBottomColor: Colors.error }]}>
            <View style={styles.statChip}>
              <Text style={styles.statChipText}>TOTAL FOCOS</Text>
            </View>
            <Text style={styles.statNumber}>{focosActivos}</Text>
            <Text style={styles.statSubText}>Activos en T. Real</Text>
          </View>

          <View style={[styles.statCard, { borderBottomColor: Colors.secondary }]}>
            <View style={styles.statChip}>
              <Text style={styles.statChipText}>REPORTES</Text>
            </View>
            <Text style={styles.statNumber}>{reportes.length}</Text>
            <Text style={styles.statSubText}>Por Ciudadanos</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos Reportes</Text>
          {reportes.length === 0 ? (
            <Text style={styles.emptyText}>No hay reportes recientes.</Text>
          ) : (
            reportes.slice(0, 5).map(reporte => (
              <View key={`reporte-${reporte.id}`} style={styles.card}>
                <Text style={styles.reporteId}>Reporte #{reporte.id}</Text>
                <Text style={styles.reporteDesc}>{reporte.descripcion}</Text>
                <Text style={styles.cardText}>Ubicación: {Number(reporte.latitud).toFixed(3)}, {Number(reporte.longitud).toFixed(3)}</Text>
                {reporte.estado && (
                  <View style={styles.statusChip}>
                    <Text style={styles.statusChipText}>ESTADO: {reporte.estado}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focos Detectados</Text>
          {focos.length === 0 ? (
            <Text style={styles.emptyText}>No hay focos registrados.</Text>
          ) : (
            focos.map(foco => {
              const isActivo = foco.estado?.toUpperCase() === 'ACTIVO';
              return (
                <View 
                  key={`foco-${foco.id}`} 
                  style={[
                    styles.card, 
                    isActivo ? styles.focoCardActive : styles.focoCardInactive
                  ]}
                >
                  <Text style={[styles.focoId, isActivo && { color: Colors.onErrorContainer }]}>
                    Foco #{foco.id}
                  </Text>
                  <Text style={styles.focoTitle}>
                    Ubicación {Number(foco.latitud).toFixed(4)}, {Number(foco.longitud).toFixed(4)}
                  </Text>
                  <Text style={[styles.focoStatus, isActivo && { color: Colors.error }]}>
                    ESTADO: {foco.estado}
                  </Text>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      <TouchableOpacity 
        style={styles.floatingButton} 
        onPress={() => router.push('/funcionario')}
      >
        <Ionicons name="shield-checkmark" size={24} color={Colors.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.onBackground,
    letterSpacing: 1.5,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: Colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  topAppBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 64,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.error,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 48,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    rowGap: 16,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    borderBottomWidth: 4,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statChip: {
    backgroundColor: Colors.surfaceVariant,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 16,
  },
  statChipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.onSurfaceVariant,
    letterSpacing: -0.5,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  statSubText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.onSurfaceVariant,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    color: Colors.onSurface,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.onSurfaceVariant,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    elevation: 1,
  },
  reporteId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.secondary,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  reporteDesc: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 12,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.onSurfaceVariant,
    letterSpacing: -0.5,
  },
  focoCardActive: {
    backgroundColor: Colors.errorContainer,
    borderColor: Colors.errorContainer,
    borderLeftWidth: 8,
    borderLeftColor: Colors.error,
  },
  focoCardInactive: {
    borderLeftWidth: 8,
    borderLeftColor: Colors.outlineVariant,
  },
  focoId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  focoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  focoStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.onSurfaceVariant,
    marginTop: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: Colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
