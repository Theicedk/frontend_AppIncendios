import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { ReporteDTO } from '../../services/apiGateway';

export interface FormularioReporteProps {
  onSubmit: (data: ReporteDTO) => void;
}

const FormularioReporte: React.FC<FormularioReporteProps> = ({ onSubmit }) => {
  const [descripcion, setDescripcion] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');

  const handleSubmit = () => {
    if (!descripcion || !latitud || !longitud) return;

    onSubmit({
      descripcion,
      latitud: parseFloat(latitud),
      longitud: parseFloat(longitud),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reportar Incendio</Text>
      <Text style={styles.subtitle}>
        Proporcione detalles precisos para agilizar la respuesta de los servicios de emergencia.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Indique puntos de referencia, magnitud observada o personas atrapadas..."
          placeholderTextColor={Colors.outline}
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Latitud</Text>
          <TextInput
            style={styles.input}
            placeholder="-33.4489"
            placeholderTextColor={Colors.outline}
            value={latitud}
            onChangeText={setLatitud}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Longitud</Text>
          <TextInput
            style={styles.input}
            placeholder="-70.6693"
            placeholderTextColor={Colors.outline}
            value={longitud}
            onChangeText={setLongitud}
            keyboardType="numeric"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} activeOpacity={0.8}>
        <Text style={styles.buttonText}>ENVIAR REPORTE CRÍTICO</Text>
      </TouchableOpacity>
      
      <Text style={styles.warningText}>LA FALSIFICACIÓN DE REPORTES ES UN DELITO PENADO</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: Colors.background,
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.onSurface,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: Colors.onSurfaceVariant,
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#f3f3f4', // surface-container-low from stitch
    borderRadius: 12,
    padding: 16,
    color: Colors.onSurface,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: Colors.onPrimary,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  locationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  locationStatusText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  locationSuccessText: {
    color: Colors.primary,
  },
  locationErrorText: {
    color: Colors.error,
  },
  warningText: {
    textAlign: 'center',
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
  }
});

export default FormularioReporte;

