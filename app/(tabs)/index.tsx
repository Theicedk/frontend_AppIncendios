import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Marker, Region } from 'react-native-maps';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { UbicacionContext } from '../../context/UbicacionContext';
import { fetchFocos, FocoMapaDTO, fetchZonasRiesgo, ZonaRiesgoDTO, fetchCompanias, CompaniaDTO } from '../../services/apiGateway';

const FOCOS_POLL_INTERVAL = 15000;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CitizenScreen() {
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const ubicacionCtx = useContext(UbicacionContext);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [permGranted, setPermGranted] = useState<boolean | null>(null);
  const [focos, setFocos] = useState<FocoMapaDTO[]>([]);
  const [zonasRiesgo, setZonasRiesgo] = useState<ZonaRiesgoDTO[]>([]);
  const [companias, setCompanias] = useState<CompaniaDTO[]>([]);
  const [focosLoading, setFocosLoading] = useState(true);
  const alarmSound = useRef<Audio.Sound | null>(null);

  const cargarFocos = useCallback(async () => {
    try {
      const data = await fetchFocos();
      setFocos(data);
    } catch {
      // Silencioso: mantener los focos anteriores
    } finally {
      setFocosLoading(false);
    }
    try {
      const zonas = await fetchZonasRiesgo();
      setZonasRiesgo(zonas);
    } catch {
      // Silencioso
    }
    try {
      const comps = await fetchCompanias();
      setCompanias(comps);
    } catch {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    cargarFocos();
    intervalRef.current = setInterval(cargarFocos, FOCOS_POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cargarFocos]);

  useFocusEffect(
    useCallback(() => {
      cargarFocos();
    }, [cargarFocos]),
  );

  useEffect(() => {
    let sub: Location.LocationSubscription;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermGranted(false);
        return;
      }
      setPermGranted(true);

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 5,
        },
        (loc) => setLocation(loc),
      );
    })();

    return () => {
      sub?.remove();
    };
  }, []);

  const centerOnUser = () => {
    if (!mapRef.current || !location) return;

    const region: Region = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    mapRef.current.animateToRegion(region, 800);
  };

  const lat = location?.coords.latitude;
  const lng = location?.coords.longitude;

  const focosActivos = focos.filter((f) => f.estado?.toUpperCase() === 'ACTIVO');

  let nearestDistance: number | null = null;
  if (lat != null && lng != null && focosActivos.length > 0) {
    nearestDistance = Math.min(
      ...focosActivos.map((f) => haversine(lat, lng, f.latitud, f.longitud)),
    );
  }

  const danger = nearestDistance != null && nearestDistance <= 100;

  useEffect(() => {
    let isMounted = true;

    const playAlarm = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/alarm.wav'),
          { shouldPlay: true, isLooping: true, volume: 1.0 },
        );
        if (isMounted) {
          alarmSound.current = sound;
        }
      } catch {
        // Silencioso
      }
    };

    const stopAlarm = async () => {
      if (alarmSound.current) {
        try {
          await alarmSound.current.stopAsync();
          await alarmSound.current.unloadAsync();
        } catch {
          // Silencioso
        }
        alarmSound.current = null;
      }
    };

    if (danger) {
      playAlarm();
    } else {
      stopAlarm();
    }

    return () => {
      isMounted = false;
      stopAlarm();
    };
  }, [danger]);

  if (permGranted === null) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#af101a" />
        <Text style={styles.loadingText}>OBTENIENDO UBICACION...</Text>
      </SafeAreaView>
    );
  }

  if (permGranted === false) {
    return (
      <SafeAreaView style={styles.centered}>
        <View style={styles.deniedIcon}>
          <Text style={styles.deniedIconText}>X</Text>
        </View>
        <Text style={styles.deniedTitle}>UBICACION DENEGADA</Text>
        <Text style={styles.deniedSub}>
          Esta aplicacion necesita acceso a tu ubicacion para alertarte sobre incendios cercanos.
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => Linking.openSettings()}
          activeOpacity={0.8}
        >
          <Text style={styles.retryBtnText}>ABRIR AJUSTES</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const initialRegion: Region = {
    latitude: lat ?? 19.4326,
    longitude: lng ?? -99.1332,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
          {focos.map((foco) => {
            const activo = foco.estado?.toUpperCase() === 'ACTIVO';
            return (
              <Marker
                key={`foco-${foco.id}`}
                coordinate={{ latitude: foco.latitud, longitude: foco.longitud }}
                title={`Foco #${foco.id}`}
                description={`${foco.estado} | ${lat != null && lng != null
                  ? haversine(lat, lng, foco.latitud, foco.longitud).toFixed(0)
                  : '?'} m`}
                pinColor={activo ? '#b71c1c' : '#757575'}
              />
            );
          })}
          {zonasRiesgo.map((z) => (
            <Marker
              key={`zona-${z.id}`}
              coordinate={{ latitude: z.latitud, longitude: z.longitud }}
              title={`Zona de Riesgo #${z.id}`}
              description={z.descripcion}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.riesgoMarker}>
                <View style={styles.riesgoMarkerIcon}>
                  <MaterialIcons name="warning" size={18} color="#fff" />
                </View>
                <View style={styles.riesgoMarkerArrow} />
              </View>
            </Marker>
          ))}
          {companias.map((c) => (
            <Marker
              key={`compania-${c.id}`}
              coordinate={{ latitude: c.lat, longitude: c.lng }}
              title={c.nombre}
              description={`Compañía de Bomberos${!c.activa ? ' (Inactiva)' : ''}`}
              anchor={{ x: 0.5, y: 0.9 }}
            >
              <View style={styles.companiaMarker}>
                <View style={styles.companiaMarkerIcon}>
                  <MaterialIcons name="shield" size={20} color="#fff" />
                </View>
                <View style={styles.companiaMarkerArrow} />
              </View>
            </Marker>
          ))}
        </MapView>

      <TouchableOpacity
        style={styles.fab}
        onPress={centerOnUser}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>Centrar</Text>
      </TouchableOpacity>

      {focosLoading && (
        <View style={styles.syncBadge}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.syncBadgeText}>Cargando focos...</Text>
        </View>
      )}

      {danger ? (
        <View style={styles.dangerOverlay}>
          <View style={styles.dangerPanel}>
            <View style={styles.dangerBadge}>
              <Text style={styles.dangerBadgeText}>!</Text>
            </View>
            <Text style={styles.dangerTitle}>ZONA DE RIESGO</Text>
            <Text style={styles.dangerSub}>
              Incendio activo detectado a {nearestDistance?.toFixed(0)} metros
            </Text>
            <View style={styles.evacBox}>
              <Text style={styles.evacTitle}>INSTRUCCIONES DE EVACUACION</Text>
              <Text style={styles.evacItem}>1. Manten la calma.</Text>
              <Text style={styles.evacItem}>2. Alejate en direccion contraria al viento.</Text>
              <Text style={styles.evacItem}>3. Cubre nariz y boca con un pano humedo.</Text>
              <Text style={styles.evacItem}>4. Busca zonas despejadas sin vegetacion.</Text>
              <Text style={styles.evacItem}>5. Llama al 911 o emergencias locales.</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.safePanel}>
          <View style={styles.safeHeader}>
            <View style={styles.safeBadge}>
              <Text style={styles.safeBadgeText}>S</Text>
            </View>
            <View>
              <Text style={styles.safeTitle}>VALLE DEL SOL</Text>
              <Text style={styles.safeSub}>
                {focosActivos.length > 0
                  ? `${focosActivos.length} foco(s) activo(s)`
                  : 'Ciudadano Protegido'}
              </Text>
            </View>
          </View>

          {nearestDistance != null && (
            <View style={styles.distanceChip}>
              <Text style={styles.distanceChipText}>
                Foco mas cercano: {nearestDistance.toFixed(0)} m
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.reportBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (lat != null && lng != null) {
                ubicacionCtx?.setUbicacion(lat, lng);
              }
              router.push('/reportar');
            }}
          >
            <Text style={styles.reportBtnText}>REPORTAR EMERGENCIA</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  fab: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1c1d',
  },

  syncBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  syncBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  safePanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f9f9fa',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  safeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  safeBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  safeBadgeText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2e7d32',
  },
  safeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1a1c1d',
    letterSpacing: -0.5,
  },
  safeSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5b403d',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  distanceChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8eaf6',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    marginBottom: 16,
  },
  distanceChipText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#283593',
  },
  reportBtn: {
    backgroundColor: '#af101a',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#af101a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  reportBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },

  dangerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(183, 28, 28, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  dangerPanel: {
    width: '100%',
    alignItems: 'center',
  },
  dangerBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#ffcdd2',
  },
  dangerBadgeText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#b71c1c',
  },
  dangerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 10,
  },
  dangerSub: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffcdd2',
    marginBottom: 32,
    textAlign: 'center',
  },
  evacBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 22,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  evacTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  evacItem: {
    fontSize: 14,
    color: '#ffcdd2',
    lineHeight: 26,
    fontWeight: '600',
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9fa',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1c1d',
    letterSpacing: 1.5,
  },
  deniedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffdad6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#ba1a1a',
  },
  deniedIconText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ba1a1a',
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ba1a1a',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  deniedSub: {
    fontSize: 14,
    color: '#5b403d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  retryBtn: {
    backgroundColor: '#af101a',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#af101a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },

  riesgoMarker: {
    alignItems: 'center',
  },
  riesgoMarkerIcon: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#FFA000',
    borderWidth: 2,
    borderColor: '#BF360C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  riesgoMarkerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#BF360C',
    marginTop: -1,
  },

  companiaMarker: {
    alignItems: 'center',
  },
  companiaMarkerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1565c0',
    borderWidth: 2,
    borderColor: '#42a5f5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1565c0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  companiaMarkerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#42a5f5',
    marginTop: -1,
  },
});
