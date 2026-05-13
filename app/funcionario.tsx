import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchReportes, verificarReporte, ReporteListaDTO } from '@/services/apiGateway';
import { Colors } from '@/constants/Colors';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function FuncionarioScreen() {
  const router = useRouter();
  const [reportes, setReportes] = useState<ReporteListaDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarReportes();
    }, [])
  );

  const cargarReportes = async () => {
    try {
      setLoading(true);
      const data = await fetchReportes();
      setReportes(data.reverse()); // Mostrar los más recientes primero
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificar = async (id: number) => {
    try {
      await verificarReporte(id);
      Alert.alert('Éxito', 'Reporte verificado. Los mapas se actualizarán en breve.');
      cargarReportes();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo verificar el reporte');
    }
  };

  const renderItem = ({ item }: { item: ReporteListaDTO }) => {
    const isPendiente = !item.estado || item.estado.toUpperCase() === 'REPORTADO' || item.estado.toUpperCase() === 'PENDIENTE';
    const isVerificado = item.estado?.toUpperCase() === 'VERIFICADO';

    return (
      <View style={styles.card}>
        <Text style={styles.cardId}>Reporte #{item.id}</Text>
        <Text style={styles.cardDescription}>{item.descripcion}</Text>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.statusText}>Estado: {item.estado || 'REPORTADO'}</Text>
        </View>

        {isPendiente && (
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => handleVerificar(item.id)}
          >
            <Text style={styles.verifyButtonText}>Verificar Incidente</Text>
          </TouchableOpacity>
        )}
        
        {isVerificado && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.onPrimary} />
            <Text style={styles.verifiedBadgeText}>VERIFICADO</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel de Funcionario</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : (
        <FlatList
          data={reportes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshing={loading}
          onRefresh={cargarReportes}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.onSurfaceVariant,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 16,
    color: Colors.onSurface,
    marginBottom: 12,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
  },
  verifyButton: {
    backgroundColor: Colors.error,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: Colors.onError,
    fontWeight: 'bold',
    fontSize: 14,
  },
  verifiedBadge: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50', // Verde de éxito
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifiedBadgeText: {
    color: Colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  separator: {
    height: 16,
  },
});
