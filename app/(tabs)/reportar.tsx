import React, { useState } from 'react';
import { StyleSheet, Alert, ActivityIndicator, View, Modal, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { FormularioReporte } from '@/modules/ReportesModule';
import { enviarReporte, ReporteDTO } from '@/services/apiGateway';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAuthenticated } from '@/services/authSession';
import { useRouter } from 'expo-router';

export default function ReportarScreen() {
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: ReporteDTO) => {
    const autenticado = await isAuthenticated();
    if (!autenticado) {
      setShowLoginModal(true);
      return;
    }

    setLoading(true);
    try {
      await enviarReporte(data);
      Alert.alert('Éxito', 'Reporte enviado a Kafka');
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('sesión')) {
        setShowLoginModal(true);
      } else {
        Alert.alert('Error', error.message || 'Error al enviar reporte');
      }
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

        <Modal
          transparent
          visible={showLoginModal}
          animationType="fade"
          onRequestClose={() => setShowLoginModal(false)}
        >
          {/* Fondo oscuro semitransparente del popup. */}
          <View style={styles.modalBackdrop}>
            {/* Tarjeta central con el mensaje y las acciones. */}
            <View style={styles.modalCard}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Necesitas iniciar sesión
              </ThemedText>
              <ThemedText style={styles.modalMessage}>
                Para crear un reporte de incendio debes iniciar sesión primero.
              </ThemedText>

              {/* Botones para cerrar el popup o ir a la pantalla de login. */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.secondaryButton]}
                  onPress={() => setShowLoginModal(false)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.secondaryButtonText}>CERRAR</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.primaryButton]}
                  onPress={() => {
                    // Cerramos el popup y enviamos al usuario a la pantalla de login.
                    setShowLoginModal(false);
                    router.push('/login');
                  }}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.primaryButtonText}>IR A INICIAR SESIÓN</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    fontFamily: Fonts.rounded,
    color: Colors.onBackground,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 22,
  },
  modalTitle: {
    color: Colors.onBackground,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: Colors.surfaceVariant,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.onSurface,
    fontWeight: '800',
    fontSize: 13,
  },
  primaryButtonText: {
    color: Colors.onPrimary,
    fontWeight: '800',
    fontSize: 13,
  },
});
