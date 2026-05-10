import React, { useState } from 'react';
import { StyleSheet, Alert, ActivityIndicator, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { FormularioReporte } from '@/modules/ReportesModule';
import { enviarReporte, ReporteDTO } from '@/services/apiGateway';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReportarScreen() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: ReporteDTO) => {
    setLoading(true);
    try {
      await enviarReporte(data);
      Alert.alert('Éxito', 'Reporte enviado a Kafka');
      // FormularioReporte debería manejar su propia limpieza de formulario si es posible, 
      // o se puede forzar pasando una clave. Asumimos que maneja la limpieza o no necesita.
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al enviar reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Reportar un Incendio
        </ThemedText>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <ThemedText style={styles.loadingText}>Enviando reporte...</ThemedText>
          </View>
        ) : (
          <FormularioReporte onSubmit={handleSubmit} />
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
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontFamily: Fonts.rounded,
    marginBottom: 20,
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: Fonts.regular,
    color: Colors.onBackground,
  },
});
