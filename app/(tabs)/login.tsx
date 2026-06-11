import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/icon-symbol';





//Boton de login 
export default function LoginScreen() {
  const handleLogin = () => {
    console.log('Iniciar Sesión apretado');
  };

//Boton de logout
  const handleLogout = () => {
    console.log('Cerrar Sesión apretado');
  };

  const handleTestBackend = async () => {
    console.log('Probar Conexión al Backend apretado');
    try {
      const response = await fetch('http://192.168.1.16:8080/api/reportes');
      
      console.log('Código de respuesta del servidor:', response.status);
      
      if (response.status === 401) {
        console.log('Conexión al Backend exitosa, pero no autenticado (401 Unauthorized)');
      } else {
        console.log('El servidor respondio inesperadamente con status:', response.status);
      }
    } catch (error) {
      console.log('Error al conectar con el Backend:', error);
    }





    
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Encabezado */}
        <View style={styles.header}>
          <IconSymbol size={80} name="person.circle.fill" color={Colors.light.tint} />
          <ThemedText style={styles.title}>Mi Cuenta</ThemedText>
          <ThemedText style={styles.subtitle}>
            Gestiona tu acceso y comprueba la conexión
          </ThemedText>
        </View>

        {/* Sección de Botones */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <IconSymbol size={24} name="lock.fill" color="#fff" />
            <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
            <IconSymbol size={24} name="lock.open.fill" color={Colors.light.tint} />
            <Text style={styles.secondaryButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={handleTestBackend}>
            <IconSymbol size={24} name="network" color="#fff" />
            <Text style={styles.testButtonText}>Probar Conexión al Backend</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.tint,
    gap: 8,
  },
  secondaryButtonText: {
    color: Colors.light.tint,
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
