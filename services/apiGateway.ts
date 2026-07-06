import { DashboardDTO } from '../types/DashboardDTO';

export type ReporteDTO = {
  descripcion: string;
  latitud: number;
  longitud: number;
};

export type FocoMapaDTO = {
  id: number;
  latitud: number;
  longitud: number;
  estado: string;
};

export type ReporteListaDTO = {
  id: number;
  descripcion: string;
  latitud: number;
  longitud: number;
  estado?: string;
};

export type ZonaRiesgoDTO = {
  id: number;
  descripcion: string;
  latitud: number;
  longitud: number;
};

export type CompaniaDTO = {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  activa: boolean;
};

const BASE_URL = 'https://smitten-railway-headrest.ngrok-free.dev/api';
const FETCH_TIMEOUT = 15000;

class TimeoutError extends Error {
  constructor() {
    super('Tiempo de conexion agotado (15s). Verifique que el backend este corriendo y sea accesible desde este dispositivo.');
    this.name = 'TimeoutError';
  }
}

const fetchWithTimeout = (url: string, options?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    ...(options?.headers as Record<string, string> || {}),
  };
  return fetch(url, { ...options, signal: controller.signal, headers })
    .catch((err) => {
      if (err.name === 'AbortError' || err.message === 'Aborted') {
        clearTimeout(timeoutId);
        throw new TimeoutError();
      }
      throw err;
    })
    .finally(() => clearTimeout(timeoutId));
};

export const fetchReportes = async (): Promise<ReporteListaDTO[]> => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/reportes`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    return data as ReporteListaDTO[];
  } catch (error: any) {
    throw new Error(error.message || 'Error fetching reportes');
  }
};

export const fetchFocos = async (): Promise<FocoMapaDTO[]> => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/focos`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    return data as FocoMapaDTO[];
  } catch (error: any) {
    throw new Error(error.message || 'Error fetching focos');
  }
};

export const enviarReporte = async (data: ReporteDTO): Promise<void> => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/reportes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error enviando reporte');
  }
};

export const verificarReporte = async (id: number) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/reportes/${id}/verificar`, {
      method: 'PUT', // Asegurar que sea PUT
      headers: {
        'Content-Type': 'application/json' // Obligatorio para peticiones JSON
      },
      // body: JSON.stringify({...}) // (Solo si necesitas enviar un body adicional mente)
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al verificar el reporte:', error);
    throw error;
  }
};

export const fetchZonasRiesgo = async (): Promise<ZonaRiesgoDTO[]> => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/zonas-riesgo`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    return data as ZonaRiesgoDTO[];
  } catch (error: any) {
    throw new Error(error.message || 'Error fetching zonas de riesgo');
  }
};

export const fetchCompanias = async (): Promise<CompaniaDTO[]> => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/companias`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    return data as CompaniaDTO[];
  } catch (error: any) {
    throw new Error(error.message || 'Error fetching companias');
  }
};

export const fetchDashboardCombinado = async (): Promise<DashboardDTO> => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/bff/dashboard-combinado`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    return data as DashboardDTO;
  } catch (error: any) {
    throw new Error(error.message || 'Error fetching dashboard combinado');
  }
};
