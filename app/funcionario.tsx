import { useLayoutEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';

/**
 * Esta pantalla está deprecated — el rol de Funcionario/Autoridad fue migrado
 * a un dashboard web independiente. La app móvil ahora es exclusiva para Ciudadano.
 * Si por algún motivo la navegación llega aquí, se redirige al dashboard principal.
 */
export default function FuncionarioScreen() {
  useLayoutEffect(() => {
    router.replace('/');
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
